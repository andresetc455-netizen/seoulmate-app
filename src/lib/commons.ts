// Galería libre: fotos reales de BTS con licencia libre desde Wikimedia Commons (con autoría y licencia).
export interface CommonsPhoto {
  id: string; // título del archivo ("File:...")
  thumb: string;
  page: string;
  author: string;
  license: string;
  description: string;
}

export const GALLERY_FILTERS: Array<{ id: string; label: string; search: string; alias: RegExp }> = [
  { id: 'bts', label: 'BTS', search: 'BTS Bangtan', alias: /\b(BTS|Bangtan)\b/i },
  { id: 'RM', label: 'RM', search: 'RM BTS Kim Namjoon', alias: /\b(RM|Nam-?joon|Namjoon)\b/i },
  { id: 'Jin', label: 'Jin', search: 'Jin BTS Kim Seokjin', alias: /\b(Jin|Seok-?jin)\b/i },
  { id: 'SUGA', label: 'SUGA', search: 'Suga BTS Min Yoongi', alias: /\b(Suga|Agust D|Yoon-?gi)\b/i },
  { id: 'j-hope', label: 'j-hope', search: 'J-Hope BTS Jung Hoseok', alias: /\b(J-?Hope|Ho-?seok)\b/i },
  { id: 'Jimin', label: 'Jimin', search: 'Jimin BTS', alias: /\bJimin\b/i },
  { id: 'V', label: 'V', search: 'V BTS Kim Taehyung', alias: /\b(Tae-?hyung|V \(singer\)|BTS V)\b/i },
  { id: 'Jung Kook', label: 'Jung Kook', search: 'Jungkook BTS', alias: /\b(Jung ?kook|Jeon Jung)\b/i },
];

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

interface ApiPage {
  title: string;
  imageinfo?: Array<{ thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }>;
}

export function parseCommons(json: unknown, alias?: RegExp): { photos: CommonsPhoto[]; next: number | null } {
  const j = json as { query?: { pages?: Record<string, ApiPage & { index?: number }> }; continue?: { gsroffset?: number } };
  const pages = Object.values(j?.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const photos: CommonsPhoto[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl || !/^https:\/\/upload\.wikimedia\.org\//.test(info.thumburl)) continue;
    const meta = info.extmetadata ?? {};
    const description = strip(meta.ImageDescription?.value ?? '');
    if (alias && !alias.test(p.title) && !alias.test(description)) continue;
    photos.push({
      id: p.title,
      thumb: info.thumburl,
      page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
      author: strip(meta.Artist?.value ?? '') || 'Autor en Commons',
      license: strip(meta.LicenseShortName?.value ?? '') || 'Licencia libre',
      description: description.slice(0, 160),
    });
  }
  return { photos, next: typeof j?.continue?.gsroffset === 'number' ? j.continue.gsroffset : null };
}

export async function searchCommons(filterId: string, offset = 0): Promise<{ photos: CommonsPhoto[]; next: number | null }> {
  const f = GALLERY_FILTERS.find((x) => x.id === filterId) ?? GALLERY_FILTERS[0];
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '40',
    gsroffset: String(offset),
    gsrsearch: `${f.search} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '480',
    iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!res.ok) throw new Error(`Commons respondió ${res.status}`);
  return parseCommons(await res.json(), f.alias);
}

/** Descarga la miniatura para guardarla cifrada como photocard (queda disponible sin conexión). */
export async function downloadPhoto(p: CommonsPhoto): Promise<File> {
  const res = await fetch(p.thumb, { mode: 'cors' });
  if (!res.ok) throw new Error('No se pudo descargar la foto');
  const blob = await res.blob();
  return new File([blob], p.id.replace(/^File:/, ''), { type: blob.type || 'image/jpeg' });
}
