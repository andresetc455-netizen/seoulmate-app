// Extra del service worker: abrir la app al tocar un aviso y buscar noticias de BTS en segundo plano
// (Periodic Background Sync: solo Chrome/Android con la app instalada; en el resto, al abrir la app).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate && c.navigate(url).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

async function checkNews() {
  const cache = await caches.open('seoulmate-meta');
  const metaRes = await cache.match('news-meta');
  const meta = metaRes ? await metaRes.json() : { enabled: false, seenAt: 0 };
  if (!meta.enabled || Notification.permission !== 'granted') return;
  const res = await fetch(new URL('news.json?t=' + Date.now(), self.registration.scope), { cache: 'no-store' });
  if (!res.ok) return;
  const feed = await res.json();
  const fresh = (feed.items || []).filter((i) => Date.parse(i.date) > (meta.seenAt || 0));
  if (!fresh.length) return;
  meta.seenAt = Math.max(...fresh.map((i) => Date.parse(i.date)));
  await cache.put('news-meta', new Response(JSON.stringify(meta)));
  await self.registration.showNotification(fresh.length === 1 ? '💜 Novedad de BTS' : `💜 ${fresh.length} novedades de BTS`, {
    body: fresh[0].title,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'seoulmate-news',
    data: { url: './#/noticias' },
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'seoulmate-news') event.waitUntil(checkNews().catch(() => undefined));
});

// ---------- Streaming de Google Drive ----------
// El <video> pide "./__drive/ID" (misma dirección que la app) y acá se le agrega el permiso de lectura
// de Google en el encabezado, pasando también el rango pedido para poder adelantar y retroceder.
// Así no hacen falta cookies de Google (que Brave y Safari bloquean) ni poner el permiso en la dirección.
let driveToken = null;

async function readDriveToken() {
  if (driveToken) return driveToken;
  const cache = await caches.open('seoulmate-meta');
  const r = await cache.match('drive-token');
  driveToken = r ? await r.text() : null;
  return driveToken;
}

self.addEventListener('message', (event) => {
  const d = event.data;
  if (!d || d.type !== 'drive-token') return;
  driveToken = d.token || null;
  const done = () => event.ports && event.ports[0] && event.ports[0].postMessage('ok');
  event.waitUntil(
    caches
      .open('seoulmate-meta')
      .then((c) => (driveToken ? c.put('drive-token', new Response(driveToken)) : c.delete('drive-token')))
      .then(done, done),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const at = url.pathname.indexOf('/__drive/');
  if (at < 0) return;
  const id = decodeURIComponent(url.pathname.slice(at + 9));
  event.respondWith(
    (async () => {
      const token = await readDriveToken();
      if (!token) return new Response('Sin permiso de Google', { status: 401 });
      const headers = new Headers({ Authorization: 'Bearer ' + token });
      const range = event.request.headers.get('range');
      if (range) headers.set('Range', range);
      return fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media', { headers });
    })(),
  );
});
