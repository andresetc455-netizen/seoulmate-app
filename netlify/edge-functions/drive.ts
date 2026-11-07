// Intermediario de streaming para Google Drive (Netlify Edge Function).
// El <video> pide /__drive/ID?t=PERMISO al propio sitio; acá se le pide el archivo a Google con el permiso
// de solo lectura en el encabezado y se reenvía el rango, así se puede adelantar. Sirve en iPhone, donde
// Safari no deja agregar el permiso de otra forma. No guarda nada.
const PASS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const id = decodeURIComponent(url.pathname.split('/__drive/')[1] ?? '');
  const token = url.searchParams.get('t');
  if (!/^[\w-]{10,}$/.test(id) || !token) return new Response('Falta el permiso de Google', { status: 401 });
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const range = req.headers.get('range');
  if (range) headers.set('Range', range);
  const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers });
  const out = new Headers();
  for (const k of PASS) {
    const v = upstream.headers.get(k);
    if (v) out.set(k, v);
  }
  if (!out.has('accept-ranges')) out.set('accept-ranges', 'bytes');
  out.set('cache-control', 'private, no-store');
  return new Response(upstream.body, { status: upstream.status, headers: out });
};

export const config = { path: '/__drive/*' };
