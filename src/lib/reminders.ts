// Próximas fechas: cumpleaños de BTS, fechas ARMY, aniversarios, cartas/sorpresas, tareas y objetivos.
// Se calculan a partir de los datos desbloqueados; los avisos del sistema solo muestran textos genéricos
// para no revelar sorpresas en la pantalla de bloqueo.
import { ARMY_DATES } from './btsFacts';
import { daysBetweenKeys, isValidDateKey, todayKey } from './dates';
import type { ChapterData, PersonalData } from './types';

export type ReminderKind = 'bts' | 'nosotros' | 'sorpresa' | 'tarea' | 'objetivo';

export interface Reminder {
  id: string; // estable: sirve para no repetir avisos
  date: string; // YYYY-MM-DD
  title: string;
  emoji: string;
  kind: ReminderKind;
  link: string; // ruta dentro de la app
  yearly?: boolean; // para el calendario (.ics)
  days: number; // días que faltan (0 = hoy)
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Próxima ocurrencia (hoy incluido) de una fecha anual MM-DD. El 29/02 cae el 28/02 en años no bisiestos. */
export function nextYearly(md: string, now = new Date()): string {
  const today = todayKey(now);
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    let key = `${y}-${md}`;
    if (!isValidDateKey(key)) key = `${y}-${md.slice(0, 3)}28`;
    if (key >= today) return key;
  }
  return `${now.getFullYear() + 1}-${md}`;
}

function nextMonthiversary(start: string, now: Date): string | null {
  const today = todayKey(now);
  const sd = Number(start.slice(8, 10));
  for (let i = 0; i < 3; i++) {
    const base = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const key = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(Math.min(sd, last))}`;
    if (key >= today && key > start) return key;
  }
  return null;
}

export function upcomingReminders(
  { chapter, personal }: { chapter: ChapterData; personal: PersonalData },
  now = new Date(),
  horizonDays = 60,
): Reminder[] {
  const today = todayKey(now);
  const out: Omit<Reminder, 'days'>[] = [];

  for (const d of ARMY_DATES) {
    out.push({ id: `bts:${d.md}`, date: nextYearly(d.md, now), title: d.title, emoji: d.emoji, kind: 'bts', link: '/bts?tab=integrantes', yearly: true });
  }

  const start = chapter.togetherSince;
  if (start && isValidDateKey(start) && start <= today) {
    const anniv = nextYearly(start.slice(5), now);
    const years = Number(anniv.slice(0, 4)) - Number(start.slice(0, 4));
    if (years > 0) out.push({ id: 'nos:aniv', date: anniv, title: `Aniversario: ${years} ${years === 1 ? 'año' : 'años'} juntos`, emoji: '💞', kind: 'nosotros', link: '/nosotros', yearly: true });
    const month = nextMonthiversary(start, now);
    if (month && month !== anniv) out.push({ id: 'nos:mes', date: month, title: 'Mesiversario', emoji: '💜', kind: 'nosotros', link: '/nosotros' });
  }

  for (const l of chapter.letters) {
    if (l.unlockDate && !l.openedAt && l.unlockDate >= today) out.push({ id: `carta:${l.id}`, date: l.unlockDate, title: 'Se abre una carta para vos', emoji: '💌', kind: 'sorpresa', link: '/nosotros?tab=cartas' });
  }
  for (const s of chapter.surprises) {
    if (!s.openedAt && s.unlockDate >= today) out.push({ id: `sorpresa:${s.id}`, date: s.unlockDate, title: 'Se desbloquea una sorpresa', emoji: '🎁', kind: 'sorpresa', link: '/nosotros?tab=sorpresas' });
  }
  for (const t of personal.tasks) {
    if (!t.done && t.due && isValidDateKey(t.due)) {
      // Las tareas vencidas se muestran como "hoy" para que no se pierdan.
      out.push({ id: `tarea:${t.id}`, date: t.due < today ? today : t.due, title: t.due < today ? `Tarea atrasada: ${t.text}` : `Tarea: ${t.text}`, emoji: '✅', kind: 'tarea', link: '/diario' });
    }
  }
  for (const g of personal.goals) {
    if (g.targetDate && isValidDateKey(g.targetDate) && g.progress < 100 && g.targetDate >= today) {
      out.push({ id: `obj:${g.id}`, date: g.targetDate, title: `Objetivo: ${g.title}`, emoji: '🎯', kind: 'objetivo', link: '/diario' });
    }
  }

  return out
    .map((r) => ({ ...r, days: daysBetweenKeys(today, r.date) }))
    .filter((r) => r.days >= 0 && r.days <= horizonDays)
    .sort((a, b) => a.days - b.days || a.title.localeCompare(b.title));
}

export function whenText(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days < 7) return `en ${days} días`;
  if (days < 14) return 'la semana que viene';
  return `en ${days} días`;
}

// ---------- Calendario (.ics) ----------
// Un archivo .ics agrega las fechas al calendario del teléfono, que avisa aunque la app esté cerrada.
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
}

export function buildIcs(items: Array<Pick<Reminder, 'id' | 'date' | 'title' | 'emoji' | 'yearly'>>, stamp = new Date()): string {
  const dt = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Seoulmate//ES', 'CALSCALE:GREGORIAN'];
  for (const r of items) {
    const d = r.date.replace(/-/g, '');
    const next = new Date(Number(r.date.slice(0, 4)), Number(r.date.slice(5, 7)) - 1, Number(r.date.slice(8, 10)) + 1);
    const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id.replace(/[^\w:-]/g, '')}@seoulmate`,
      `DTSTAMP:${dt}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsEscape(`${r.emoji} ${r.title}`)}`,
      ...(r.yearly ? ['RRULE:FREQ=YEARLY'] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(r.title)}`,
      'TRIGGER:PT9H', // 9:00 del día
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(name: string, ics: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Avisos del sistema (con la app abierta o al abrirla) ----------
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function showNotification(title: string, body: string, url = './'): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const opts: NotificationOptions & { data?: unknown } = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(title, opts);
  } catch {
    /* sigue con la API directa */
  }
  try {
    new Notification(title, opts);
  } catch {
    /* algunos navegadores solo permiten avisos desde el service worker */
  }
}

/** Avisa una sola vez por fecha lo que es hoy o mañana. Devuelve las claves ya avisadas (recortadas). */
export async function notifyDue(reminders: Reminder[], notified: string[], now = new Date()): Promise<string[]> {
  const seen = new Set(notified);
  const fresh: string[] = [];
  for (const r of reminders) {
    if (r.days > 1) continue;
    const key = `${r.id}@${r.date}#${r.days}`;
    if (seen.has(key)) continue;
    fresh.push(key);
    await showNotification(`${r.emoji} ${r.days === 0 ? 'Hoy' : 'Mañana'}`, r.title, `./#${r.link}`);
  }
  if (!fresh.length) return notified;
  const cutoff = todayKey(new Date(now.getTime() - 40 * 86_400_000));
  return [...notified.filter((k) => (k.split('@')[1] ?? '').slice(0, 10) >= cutoff), ...fresh];
}
