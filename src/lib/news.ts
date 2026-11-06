// Noticias de BTS. Un flujo programado de GitHub Actions junta titulares de fuentes públicas (RSS)
// cada pocas horas y publica news.json junto a la app; acá se leen, se clasifican y se guardan
// los últimos para verlos sin conexión. Los titulares son públicos: no van a la bóveda cifrada.
import { useEffect, useState } from 'react';

export interface RawNews {
  title: string;
  link: string;
  source: string;
  date: string; // ISO
}
export interface NewsItem extends RawNews {
  id: string;
  topics: NewsTopic[];
  members: string[];
}
export type NewsTopic = 'gira' | 'musica' | 'premios' | 'tv' | 'servicio' | 'otros';

export const TOPIC_LABEL: Record<NewsTopic, string> = {
  gira: 'Giras y eventos',
  musica: 'Música',
  premios: 'Récords y premios',
  tv: 'TV y shows',
  servicio: 'Servicio militar',
  otros: 'Otras',
};

/** Palabras completas, también con tildes (\b de JS no reconoce letras acentuadas). */
const w = (alts: string) => new RegExp(`(?<![\\p{L}\\d])(?:${alts})(?![\\p{L}\\d])`, 'iu');

const TOPIC_RULES: Array<[NewsTopic, RegExp]> = [
  ['gira', w(String.raw`tour|gira|concierto|concert|stadium|estadio|show en vivo|fan ?meeting|fanmeet|festival|festa|entradas|tickets?|world tour|live`)],
  ['musica', w(String.raw`album|álbum|single|sencillo|canci[oó]n|song|track|mv|video ?clip|comeback|regreso|lanza(?:miento|mientos|r|n|rá|ron)?|estren\p{L}*|release|teaser|tracklist|ost|collab|colaboraci[oó]n|chart|spotify`)],
  ['premios', w(String.raw`r[eé]cord|record|billboard|grammy|premio|awards?|gan[aó]n?|ganaron|premios|wins?|n[uú]mero 1|#1|hot 100|million|mill[oó]n|ventas|sales`)],
  ['tv', w(String.raw`variety|reality|documental|documentary|netflix|disney|interview|entrevista|programa|show|run bts|in the soop|weverse live|vlive`)],
  ['servicio', w(String.raw`militar|military|enlist|discharge|alistamiento|licencia|servicio`)],
];

const MEMBER_RULES: Array<[string, RegExp]> = [
  ['RM', /\b(RM|Kim Nam-?joon|Namjoon)\b/],
  ['Jin', /\b(Jin|Kim Seok-?jin|Seokjin)\b/],
  ['SUGA', /\b(SUGA|Suga|Agust D|Min Yoon-?gi|Yoongi)\b/],
  ['j-hope', /\b(j-?hope|J-?Hope|Jung Ho-?seok|Hoseok)\b/],
  ['Jimin', /\b(Jimin|Park Ji-?min)\b/],
  ['V', /\b(V de BTS|BTS'?s? V|BTS V|Kim Tae-?hyung|Taehyung)\b/],
  ['Jung Kook', /\b(Jung ?[Kk]ook|Jeon Jung-?kook|JK de BTS)\b/],
];

const BTS_RE = /\b(BTS|Bangtan|ARMY|BIGHIT|Big Hit|HYBE)\b/;

/** Descarta titulares que no son de BTS (en español "BTS" también es una sigla técnica). */
export function isAboutBts(title: string): boolean {
  return BTS_RE.test(title) || MEMBER_RULES.some(([name, re]) => name !== 'Jin' && name !== 'V' && name !== 'RM' && re.test(title));
}

export function classify(raw: RawNews): NewsItem {
  const topics = TOPIC_RULES.filter(([, re]) => re.test(raw.title)).map(([t]) => t);
  const members = MEMBER_RULES.filter(([, re]) => re.test(raw.title)).map(([m]) => m);
  return { ...raw, id: normalizeTitle(raw.title), topics: topics.length ? topics : ['otros'], members };
}

export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 90);
}

export interface NewsFeed {
  updatedAt: string | null;
  items: NewsItem[];
}

const CACHE_KEY = 'seoulmate-news';

function readCache(): NewsFeed {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as NewsFeed;
  } catch {
    /* almacenamiento bloqueado */
  }
  return { updatedAt: null, items: [] };
}

export function parseFeed(json: unknown): NewsFeed {
  const j = json as { updatedAt?: unknown; items?: unknown };
  const items = Array.isArray(j?.items) ? j.items : [];
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items as Array<Partial<RawNews>>) {
    if (!it || typeof it.title !== 'string' || typeof it.link !== 'string' || !/^https?:\/\//.test(it.link)) continue;
    if (!isAboutBts(it.title)) continue;
    const n = classify({ title: it.title.trim(), link: it.link, source: String(it.source ?? ''), date: String(it.date ?? '') });
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  out.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  return { updatedAt: typeof j?.updatedAt === 'string' ? j.updatedAt : null, items: out };
}

export async function fetchNews(): Promise<NewsFeed> {
  const res = await fetch(`news.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(res.status === 404 ? 'Todavía no hay noticias publicadas' : `Error ${res.status}`);
  const feed = parseFeed(await res.json());
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(feed));
  } catch {
    /* sin espacio: igual se muestran */
  }
  return feed;
}

export function useNews(): { feed: NewsFeed; loading: boolean; error: string; reload: () => void } {
  const [feed, setFeed] = useState<NewsFeed>(readCache);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchNews()
      .then((f) => {
        if (!alive) return;
        setFeed(f);
        setError('');
      })
      .catch((e) => alive && setError(navigator.onLine ? (e instanceof Error ? e.message : 'No se pudieron cargar') : 'Sin conexión: mostrando las últimas guardadas'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [n]);
  return { feed, loading, error, reload: () => setN((x) => x + 1) };
}

export function newsTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!t) return '';
  const min = Math.round((now - t) / 60000);
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/** Para que el service worker avise de noticias aunque la app esté cerrada (Android, app instalada). */
export async function setBackgroundNews(enabled: boolean, seenAt: number): Promise<void> {
  try {
    const cache = await caches.open('seoulmate-meta');
    await cache.put('news-meta', new Response(JSON.stringify({ enabled, seenAt })));
    const reg = (await navigator.serviceWorker?.getRegistration()) as (ServiceWorkerRegistration & { periodicSync?: { register(tag: string, o: { minInterval: number }): Promise<void>; unregister(tag: string): Promise<void> } }) | undefined;
    if (!reg?.periodicSync) return;
    if (enabled) await reg.periodicSync.register('seoulmate-news', { minInterval: 3 * 60 * 60 * 1000 });
    else await reg.periodicSync.unregister('seoulmate-news');
  } catch {
    /* navegador sin soporte: los avisos llegan al abrir la app */
  }
}
