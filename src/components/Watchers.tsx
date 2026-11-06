// Avisos con la app abierta o al abrirla: fechas de hoy/mañana y noticias nuevas de BTS.
import { useEffect } from 'react';
import { chapterDoc, personalDoc, settingsDoc } from '../lib/docs';
import { notifyDue, showNotification, upcomingReminders } from '../lib/reminders';
import { fetchNews } from '../lib/news';

async function runChecks() {
  const s = settingsDoc.get();
  if (!s.notify || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const reminders = upcomingReminders({ chapter: chapterDoc.get(), personal: personalDoc.get() }, new Date(), 1);
  const notified = await notifyDue(reminders, s.notified ?? []);
  if (notified !== s.notified) await settingsDoc.update((x) => ({ ...x, notified }));
  try {
    const feed = await fetchNews();
    const since = Math.max(settingsDoc.get().newsNotifiedAt ?? 0, settingsDoc.get().newsSeenAt ?? 0);
    const fresh = feed.items.filter((i) => (Date.parse(i.date) || 0) > since);
    if (!fresh.length) return;
    // La primera vez solo se marca el punto de partida, para no avisar de noticias viejas.
    if (since > 0) {
      await showNotification(fresh.length === 1 ? '💜 Novedad de BTS' : `💜 ${fresh.length} novedades de BTS`, fresh[0].title, './#/noticias');
    }
    const newest = Math.max(...fresh.map((i) => Date.parse(i.date) || 0));
    await settingsDoc.update((x) => ({ ...x, newsNotifiedAt: newest }));
  } catch {
    /* sin conexión o sin noticias publicadas */
  }
}

export function Watchers() {
  useEffect(() => {
    void runChecks();
    const onVis = () => document.visibilityState === 'visible' && void runChecks();
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(() => void runChecks(), 30 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(t);
    };
  }, []);
  return null;
}
