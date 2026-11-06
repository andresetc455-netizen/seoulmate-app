// Junta titulares de BTS desde fuentes RSS públicas y escribe news.json (lo corre GitHub Actions cada 3 horas).
// Uso: node scripts/fetch-news.mjs dist/news.json
// Si todas las fuentes fallan, conserva el news.json publicado anteriormente (PREVIOUS_URL).
import { writeFile } from 'node:fs/promises';

const out = process.argv[2] ?? 'dist/news.json';
const gn = (q, lang) =>
  lang === 'es'
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=AR&ceid=AR:es-419`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

const FEEDS = [
  { url: gn('BTS when:14d', 'es'), source: null },
  { url: gn('BTS (gira OR concierto OR álbum OR Jung Kook OR Jimin OR j-hope OR SUGA OR Taehyung) when:14d', 'es'), source: null },
  { url: gn('BTS when:7d', 'en'), source: null },
  { url: gn('BTS (tour OR concert OR album OR Weverse) when:14d', 'en'), source: null },
  { url: 'https://www.soompi.com/feed', source: 'Soompi' },
  { url: 'https://www.allkpop.com/rss', source: 'allkpop' },
  { url: 'https://www.koreaboo.com/feed/', source: 'Koreaboo' },
];

const BTS_RE = /\b(BTS|Bangtan|BIGHIT|HYBE|Jung ?Kook|Jimin|j-?hope|SUGA|Agust D|Taehyung|Seokjin|Namjoon|Yoongi|Hoseok)\b/i;
const MAX_AGE_DAYS = 21;
const MAX_ITEMS = 120;

const decode = (s) =>
  s
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1].trim()) : '';
};

function parse(xml, fixedSource) {
  const items = [];
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const b = m[0];
    let title = tag(b, 'title');
    let source = fixedSource ?? tag(b, 'source');
    // Google News agrega " - Fuente" al final del titular.
    if (!fixedSource && source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const link = tag(b, 'link');
    const date = new Date(tag(b, 'pubDate') || Date.now());
    if (!title || !/^https?:\/\//.test(link) || Number.isNaN(date.getTime())) continue;
    items.push({ title, link, source: source || 'Noticias', date: date.toISOString() });
  }
  return items;
}

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; SeoulmateNews/1.0)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 90);

const all = [];
let ok = 0;
for (const f of FEEDS) {
  try {
    const items = parse(await get(f.url), f.source).filter((i) => BTS_RE.test(i.title));
    all.push(...items);
    ok++;
    console.log(`✓ ${f.url.slice(0, 70)}… ${items.length}`);
  } catch (e) {
    console.warn(`✗ ${f.url.slice(0, 70)}… ${e.message}`);
  }
}

const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
const seen = new Set();
const items = all
  .filter((i) => Date.parse(i.date) >= cutoff && Date.parse(i.date) <= Date.now() + 3600000)
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .filter((i) => {
    const k = norm(i.title);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .slice(0, MAX_ITEMS);

let feed = { updatedAt: new Date().toISOString(), items };
if (!ok || !items.length) {
  const prev = process.env.PREVIOUS_URL;
  if (prev) {
    try {
      feed = JSON.parse(await get(prev));
      console.warn('Sin noticias nuevas: se conserva el news.json anterior.');
    } catch {
      console.warn('No se pudo recuperar el news.json anterior.');
    }
  }
}
await writeFile(out, JSON.stringify(feed));
console.log(`news.json: ${feed.items?.length ?? 0} noticias → ${out}`);
