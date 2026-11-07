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

// El streaming de Google Drive lo resuelve el sitio (función /__drive en Netlify); el service worker no
// intercepta esas direcciones para que Safari reciba las respuestas por rangos sin cambios.
