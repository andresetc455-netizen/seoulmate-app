// "En la nube": capítulos guardados en una carpeta de OneDrive compartida con ella.
// Ella entra con SU cuenta de Microsoft (permiso de solo lectura) y la app solo puede ver lo que esa
// cuenta ve: la carpeta que le compartieron, nunca el resto del OneDrive de quien la comparte.
// Los videos se reproducen en streaming con un enlace temporal; nada se descarga ni se guarda.
import { PublicClientApplication, InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { parseEpisode, sortEpisodes } from './episodes';
import { DEFAULT_CLOUD_CLIENT_ID } from './cloudConfig';

const GRAPH = 'https://graph.microsoft.com/v1.0';
export const SCOPES = ['Files.Read.All'];

export interface CloudEpisode {
  id: string;
  driveId: string;
  name: string;
  ep: number | null;
  size: number;
  subId?: string; // subtítulo .srt/.vtt con el mismo nombre
}
export interface CloudShow {
  id: string;
  name: string;
  episodes: CloudEpisode[];
}
interface GraphItem {
  id: string;
  name: string;
  size?: number;
  folder?: { childCount: number };
  file?: { mimeType?: string };
  parentReference?: { driveId?: string };
  '@microsoft.graph.downloadUrl'?: string;
}

/** El "Application (client) ID" de Microsoft es un GUID. */
export function isValidClientId(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

export function isShareLink(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' && /(^|\.)(1drv\.ms|onedrive\.live\.com|sharepoint\.com)$/.test(u.hostname);
  } catch {
    return false;
  }
}

/** Formato que pide Microsoft Graph para abrir un enlace compartido: "u!" + base64url del enlace. */
export function encodeShareUrl(url: string): string {
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(url.trim())));
  return `u!${b64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-')}`;
}

const isVideo = (f: GraphItem) => !!f.file && ((f.file.mimeType ?? '').startsWith('video/') || /\.(mp4|m4v|mkv|webm|mov)$/i.test(f.name));
const isSub = (f: GraphItem) => !!f.file && /\.(srt|vtt)$/i.test(f.name);
const base = (n: string) => n.replace(/\.[a-z]{2,3}\.(srt|vtt)$/i, '').replace(/\.[^.]+$/, '').toLowerCase();

/** Arma la lista de capítulos de una carpeta, ordenados y con su subtítulo si lo hay. */
export function toEpisodes(items: GraphItem[], driveId: string): CloudEpisode[] {
  const subs = items.filter(isSub);
  return sortEpisodes(items.filter(isVideo)).map((f) => ({
    id: f.id,
    driveId: f.parentReference?.driveId ?? driveId,
    name: f.name,
    ep: parseEpisode(f.name),
    size: f.size ?? 0,
    subId: subs.find((s) => base(s.name) === base(f.name))?.id,
  }));
}

// ---------- sesión con Microsoft ----------
let app: PublicClientApplication | null = null;
let appClient = '';

async function msal(clientId: string): Promise<PublicClientApplication> {
  if (app && appClient === clientId) return app;
  app = new PublicClientApplication({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: `${location.origin}${location.pathname}`,
      // La respuesta vuelve en ?code=… (no en #) para no chocar con las rutas de la app.
      OIDCOptions: { serverResponseType: 'query', defaultScopes: ['openid', 'profile', 'offline_access'] },
      navigateToLoginRequestUrl: false,
    },
    cache: { cacheLocation: 'localStorage' },
  });
  appClient = clientId;
  await app.initialize();
  await app.handleRedirectPromise().catch(() => null);
  return app;
}

// El ID de la app de Microsoft es público (no es una contraseña); se guarda aparte para poder
// completar el regreso del inicio de sesión antes de que la bóveda esté desbloqueada.
const CLIENT_KEY = 'seoulmate-cloud-client';
export function rememberClientId(id: string): void {
  try {
    localStorage.setItem(CLIENT_KEY, id.trim());
  } catch {
    /* almacenamiento bloqueado */
  }
}
export function returningFromLogin(): boolean {
  return /[?&](code|error)=/.test(location.search);
}
/** Se llama al arrancar la app si vuelve de Microsoft: guarda la sesión y limpia la dirección. */
export async function finishRedirectLogin(): Promise<void> {
  let id: string | null = null;
  try {
    id = localStorage.getItem(CLIENT_KEY) || DEFAULT_CLOUD_CLIENT_ID;
  } catch {
    /* sin acceso */
  }
  if (id && isValidClientId(id)) await msal(id).catch(() => null);
  history.replaceState(null, '', `${location.pathname}#/dramas?tab=nube`);
}

/** Al abrir la pestaña, retoma una sesión guardada. */
export async function resumeLogin(clientId: string | undefined): Promise<AccountInfo | null> {
  if (!clientId || !isValidClientId(clientId)) return null;
  const a = await msal(clientId.trim());
  return a.getAllAccounts()[0] ?? null;
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export async function signIn(clientId: string): Promise<AccountInfo | null> {
  const a = await msal(clientId.trim());
  // En la app instalada las ventanas emergentes suelen bloquearse: se usa redirección.
  if (standalone()) {
    await a.loginRedirect({ scopes: SCOPES, prompt: 'select_account' });
    return null;
  }
  const r = await a.loginPopup({ scopes: SCOPES, prompt: 'select_account' });
  return r.account;
}

export async function signOut(clientId: string): Promise<void> {
  const a = await msal(clientId.trim());
  const acc = a.getAllAccounts()[0];
  if (acc) await a.clearCache({ account: acc });
}

async function token(clientId: string): Promise<string> {
  const a = await msal(clientId.trim());
  const account = a.getAllAccounts()[0];
  if (!account) throw new NotSignedIn();
  try {
    return (await a.acquireTokenSilent({ scopes: SCOPES, account })).accessToken;
  } catch (e) {
    if (!(e instanceof InteractionRequiredAuthError)) throw e;
    if (standalone()) {
      await a.acquireTokenRedirect({ scopes: SCOPES, account });
      throw new NotSignedIn();
    }
    return (await a.acquireTokenPopup({ scopes: SCOPES, account })).accessToken;
  }
}

export class NotSignedIn extends Error {
  constructor() {
    super('Entrá con tu cuenta de Microsoft para ver los capítulos.');
  }
}

async function graph<T>(clientId: string, path: string): Promise<T> {
  const t = await token(clientId);
  const res = await fetch(path.startsWith('http') ? path : `${GRAPH}${path}`, { headers: { Authorization: `Bearer ${t}` } });
  if (res.status === 401) throw new NotSignedIn();
  if (res.status === 403 || res.status === 404) throw new Error('Esta cuenta no tiene acceso a la carpeta. Pedile a quien la creó que la comparta con tu correo.');
  if (!res.ok) throw new Error(`OneDrive respondió ${res.status}`);
  return (await res.json()) as T;
}

async function children(clientId: string, driveId: string, itemId: string): Promise<GraphItem[]> {
  const out: GraphItem[] = [];
  let next: string | undefined = `/drives/${driveId}/items/${itemId}/children?$top=999&$select=id,name,size,folder,file,parentReference`;
  while (next) {
    const page: { value: GraphItem[]; '@odata.nextLink'?: string } = await graph(clientId, next);
    out.push(...page.value);
    next = page['@odata.nextLink'];
  }
  return out;
}

/** Lee la carpeta compartida: cada subcarpeta es un drama (con carpetas "Season 01" adentro si las hay). */
export async function loadLibrary(clientId: string, shareUrl: string): Promise<CloudShow[]> {
  const root: GraphItem = await graph(clientId, `/shares/${encodeShareUrl(shareUrl)}/driveItem?$select=id,name,folder,parentReference`);
  const driveId = root.parentReference?.driveId;
  if (!driveId || !root.folder) throw new Error('El enlace no es de una carpeta.');
  const top = await children(clientId, driveId, root.id);
  const shows: CloudShow[] = [];
  for (const f of top.filter((x) => x.folder)) {
    const items = await children(clientId, driveId, f.id);
    const seasons = await Promise.all(items.filter((x) => x.folder).map((s) => children(clientId, driveId, s.id)));
    const eps = toEpisodes([...items, ...seasons.flat()], driveId);
    if (eps.length) shows.push({ id: f.id, name: f.name.replace(/\s*\(\d{4}\)\s*$/, ''), episodes: eps });
  }
  shows.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const loose = toEpisodes(top, driveId);
  if (loose.length) shows.push({ id: root.id, name: 'Otros', episodes: loose });
  return shows;
}

/** Enlace temporal (≈1 hora) para reproducir el archivo en streaming. */
export async function streamUrl(clientId: string, ep: { driveId: string; id: string }): Promise<string> {
  const item: GraphItem = await graph(clientId, `/drives/${ep.driveId}/items/${ep.id}`);
  const url = item['@microsoft.graph.downloadUrl'];
  if (!url) throw new Error('No se pudo abrir el capítulo.');
  return url;
}

export async function subtitleText(clientId: string, ep: { driveId: string; subId?: string }): Promise<string | null> {
  if (!ep.subId) return null;
  try {
    const url = await streamUrl(clientId, { driveId: ep.driveId, id: ep.subId });
    const res = await fetch(url);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}
