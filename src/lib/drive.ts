// "En la nube": capítulos guardados en una carpeta de Google Drive.
// Ella inicia sesión con Google (permiso de solo lectura); la app lista las subcarpetas (una por drama)
// y sus videos, y los reproduce con el reproductor de Drive, en streaming, sin descargarlos.
// El token vive solo en memoria y nunca se guarda.
import { parseEpisode, sortEpisodes } from './episodes';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const API = 'https://www.googleapis.com/drive/v3/files';

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  videoMediaMetadata?: { durationMillis?: string; width?: number; height?: number };
}
export interface CloudShow {
  id: string;
  name: string;
  episodes: CloudEpisode[];
}
export interface CloudEpisode {
  id: string;
  driveId: string; // sin uso en Drive; mantiene la misma forma que OneDrive
  name: string;
  ep: number | null;
  size: number;
  subId?: string;
  unplayable?: boolean; // Drive no reconoce el video: está dañado o todavía lo está procesando
}

/** Acepta el enlace de la carpeta ("…/folders/ID?usp=sharing") o el ID solo. */
export function folderIdFrom(input: string): string | null {
  const v = input.trim();
  const m = v.match(/\/folders\/([\w-]{10,})/) ?? v.match(/[?&]id=([\w-]{10,})/);
  if (m) return m[1];
  return /^[\w-]{10,}$/.test(v) ? v : null;
}

export function isValidClientId(v: string): boolean {
  return /^[\w-]+\.apps\.googleusercontent\.com$/.test(v.trim());
}

const subBase = (n: string) => n.replace(/\.[a-z]{2,3}\.(srt|vtt)$/i, '').replace(/\.[^.]+$/, '').toLowerCase();
const isVideo = (f: DriveItem) => f.mimeType.startsWith('video/') || /\.(mp4|m4v|mkv|webm|mov|avi)$/i.test(f.name);
const isFolder = (f: DriveItem) => f.mimeType === 'application/vnd.google-apps.folder';

/** Arma la biblioteca: cada subcarpeta es un drama; los videos sueltos en la raíz van a "Otros". */
export function buildLibrary(root: DriveItem[], children: Record<string, DriveItem[]>): CloudShow[] {
  const toEps = (items: DriveItem[]) =>
    sortEpisodes(items.filter(isVideo)).map((f) => ({
      id: f.id,
      driveId: '',
      name: f.name,
      ep: parseEpisode(f.name),
      size: Number(f.size ?? 0),
      subId: items.find((x) => /\.(srt|vtt)$/i.test(x.name) && subBase(x.name) === subBase(f.name))?.id,
      unplayable: !f.videoMediaMetadata?.durationMillis,
    }));
  const shows: CloudShow[] = root
    .filter(isFolder)
    .map((f) => ({ id: f.id, name: f.name.replace(/\s*\(\d{4}\)\s*$/, ''), episodes: toEps(children[f.id] ?? []) }))
    .filter((s) => s.episodes.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const loose = toEps(root);
  if (loose.length) shows.push({ id: 'loose', name: 'Otros', episodes: loose });
  return shows;
}

async function list(token: string, parent: string): Promise<DriveItem[]> {
  const out: DriveItem[] = [];
  let page: string | undefined;
  do {
    const p = new URLSearchParams({
      q: `'${parent}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, thumbnailLink, videoMediaMetadata)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (page) p.set('pageToken', page);
    const res = await fetch(`${API}?${p}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) throw new DriveAuthError();
    if (res.status === 404) throw new Error('No encontramos la carpeta. ¿Está compartida con esta cuenta?');
    if (!res.ok) throw new Error(`Google Drive respondió ${res.status}`);
    const j = (await res.json()) as { files?: DriveItem[]; nextPageToken?: string };
    out.push(...(j.files ?? []));
    page = j.nextPageToken;
  } while (page);
  return out;
}

export class DriveAuthError extends Error {
  constructor() {
    super('La sesión de Google venció. Volvé a conectar.');
  }
}

/** Lee la carpeta raíz y una subcarpeta por drama (subcarpetas "Season 01" incluidas). */
export async function loadLibrary(token: string, rootId: string): Promise<CloudShow[]> {
  const root = await list(token, rootId);
  const children: Record<string, DriveItem[]> = {};
  await Promise.all(
    root.filter(isFolder).map(async (f) => {
      const items = await list(token, f.id);
      const seasons = items.filter(isFolder);
      const nested = await Promise.all(seasons.map((s) => list(token, s.id)));
      children[f.id] = [...items, ...nested.flat()];
    }),
  );
  return buildLibrary(root, children);
}

export function isDriveLink(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' && u.hostname === 'drive.google.com' && !!folderIdFrom(v);
  } catch {
    return false;
  }
}

/**
 * Dirección para el <video>. Si el service worker de la app está activo, el video se pide a "./__drive/ID"
 * y el service worker agrega el permiso en el encabezado (funciona aunque el navegador bloquee cookies).
 * Si no, se usa la dirección directa de la API con el permiso.
 */
export async function mediaUrl(fileId: string, accessToken: string): Promise<string> {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker?.controller : null;
  if (sw) {
    const ok = await new Promise<boolean>((resolve) => {
      const ch = new MessageChannel();
      const timer = setTimeout(() => resolve(false), 1500);
      ch.port1.onmessage = () => {
        clearTimeout(timer);
        resolve(true);
      };
      sw.postMessage({ type: 'drive-token', token: accessToken }, [ch.port2]);
    });
    if (ok) return `./__drive/${encodeURIComponent(fileId)}`;
  }
  return directMediaUrl(fileId, accessToken);
}

export function directMediaUrl(fileId: string, accessToken: string): string {
  return `${API}/${encodeURIComponent(fileId)}?alt=media&access_token=${encodeURIComponent(accessToken)}`;
}

/** Olvida el permiso también en el service worker. */
export function forgetStreamToken(): void {
  navigator.serviceWorker?.controller?.postMessage({ type: 'drive-token', token: null });
}

export async function subtitleText(fileId: string, accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/${encodeURIComponent(fileId)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// ---------- qué hay realmente adentro del archivo ----------
export type FileKind = 'mp4' | 'ts' | 'mkv' | 'html' | 'playlist' | 'unknown';

/** Reconoce el formato real por los primeros bytes (la extensión ".mp4" a veces miente). */
export function detectKind(b: Uint8Array): FileKind {
  const ascii = (from: number, len: number) => String.fromCharCode(...b.slice(from, from + len));
  if (b.length > 8 && ['ftyp', 'moov', 'mdat', 'free', 'wide'].includes(ascii(4, 4))) return 'mp4';
  if (b.length > 376 && b[0] === 0x47 && b[188] === 0x47 && b[376] === 0x47) return 'ts';
  if (b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'mkv';
  const head = ascii(0, Math.min(b.length, 512)).replace(/^\uFEFF/, '').trimStart().toLowerCase();
  if (head.startsWith('#extm3u')) return 'playlist';
  if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<')) return 'html';
  return 'unknown';
}

export function apiMediaUrl(fileId: string): string {
  return `${API}/${encodeURIComponent(fileId)}?alt=media`;
}

export async function sniffKind(fileId: string, accessToken: string): Promise<FileKind> {
  const res = await fetch(apiMediaUrl(fileId), { headers: { Authorization: `Bearer ${accessToken}`, Range: 'bytes=0-4095' } });
  if (!res.ok) return 'unknown';
  return detectKind(new Uint8Array(await res.arrayBuffer()));
}

export const KIND_MESSAGE: Record<FileKind, string> = {
  mp4: 'El archivo es un MP4, pero este teléfono no puede con su formato interno. Convertilo con HandBrake (perfil Fast 1080p30) y volvé a subirlo.',
  ts: 'El archivo es una transmisión TS y este navegador no puede convertirla. Probá desde Chrome o convertilo a MP4.',
  mkv: 'El archivo es MKV: se ve en Android y en la computadora, pero no en iPhone. Convertilo a MP4 con HandBrake.',
  html: 'Este archivo no es un video: es una página web guardada con nombre de .mp4. Hay que volver a descargar el capítulo.',
  playlist: 'Este archivo es una lista de reproducción (no tiene el video adentro). Hay que descargar el capítulo completo.',
  unknown: 'No se reconoce el formato de este archivo. Probá abrirlo con VLC en la computadora y convertirlo a MP4.',
};

export function viewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

export function previewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

// ---------- inicio de sesión con Google (Google Identity Services) ----------
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface GoogleOAuth {
  accounts: { oauth2: { initTokenClient(c: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type: string }) => void }): { requestAccessToken(o?: { prompt?: string }): void } } };
}

let gisPromise: Promise<GoogleOAuth> | null = null;
function loadGis(): Promise<GoogleOAuth> {
  const w = window as unknown as { google?: GoogleOAuth };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('No se pudo cargar el inicio de sesión de Google')));
    s.onerror = () => {
      gisPromise = null;
      reject(new Error('No se pudo cargar el inicio de sesión de Google. ¿Hay conexión?'));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

let token: { value: string; until: number } | null = null;

export function currentToken(): string | null {
  return token && token.until > Date.now() + 30_000 ? token.value : null;
}
export function forgetToken(): void {
  token = null;
  forgetStreamToken();
}

/** Pide permiso de solo lectura. La primera vez muestra la ventana de Google; después suele ser automático. */
export async function connectDrive(clientId: string, silent = false): Promise<string> {
  const g = await loadGis();
  return new Promise((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: DRIVE_SCOPE,
      callback: (r) => {
        if (!r.access_token) return reject(new Error(r.error === 'access_denied' ? 'No se dio permiso para ver Drive.' : 'No se pudo conectar con Google.'));
        token = { value: r.access_token, until: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve(r.access_token);
      },
      error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'Se cerró la ventana de Google.' : 'No se pudo abrir la ventana de Google.')),
    });
    // Con prompt vacío Google solo muestra la ventana si hace falta (primera vez o permiso vencido).
    client.requestAccessToken({ prompt: silent ? 'none' : '' });
  });
}
