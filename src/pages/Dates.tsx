// Próximas fechas y avisos: calendario del teléfono (.ics) y notificaciones.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDoc } from '../lib/store';
import { chapterDoc, personalDoc, settingsDoc } from '../lib/docs';
import { buildIcs, downloadIcs, notificationsSupported, showNotification, upcomingReminders, whenText, type Reminder } from '../lib/reminders';
import { setBackgroundNews } from '../lib/news';
import { formatKey } from '../lib/dates';
import { isIos, isStandalone } from '../lib/install';
import { Empty, toast } from '../components/ui';

export function DatesPage() {
  const chapter = useDoc(chapterDoc);
  const personal = useDoc(personalDoc);
  const all = upcomingReminders({ chapter, personal }, new Date(), 366);
  return (
    <div className="page">
      <NotifyCard />
      <div className="row spread" style={{ margin: '14px 0 8px' }}>
        <h2 style={{ margin: 0 }}>Próximas fechas</h2>
        {all.length > 0 && (
          <button className="btn sm secondary" onClick={() => downloadIcs('seoulmate-fechas.ics', buildIcs(all))}>
            Agregar todo al calendario
          </button>
        )}
      </div>
      {all.length === 0 ? (
        <Empty title="No hay fechas próximas" />
      ) : (
        all.map((r) => <ReminderRow key={r.id} r={r} withCalendar />)
      )}
      <p className="tiny muted" style={{ marginTop: 12 }}>
        "Al calendario" descarga un archivo que tu teléfono abre con la app de Calendario: así te avisa a las 9 de la mañana aunque Seoulmate esté cerrada. Las cartas y sorpresas aparecen con un texto genérico para no arruinar la sorpresa.
      </p>
    </div>
  );
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function ReminderRow({ r, withCalendar }: { r: Reminder; withCalendar?: boolean }) {
  return (
    <div className="item reminder" style={{ alignItems: 'center' }} data-testid="reminder">
      <span className={`date-badge k-${r.kind}`} aria-hidden="true">
        <b>{Number(r.date.slice(8, 10))}</b>
        <i>{MONTHS[Number(r.date.slice(5, 7)) - 1]}</i>
      </span>
      <Link to={r.link} className="grow" style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="title">{r.title}</div>
        <div className="tiny muted">
          {formatKey(r.date)} · <strong>{whenText(r.days)}</strong>
        </div>
      </Link>
      {withCalendar && (
        <button className="iconbtn" aria-label={`Agregar ${r.title} al calendario`} onClick={() => downloadIcs(`${r.id.replace(/\W+/g, '-')}.ics`, buildIcs([r]))}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="3.5" y="5" width="17" height="15" rx="3" />
            <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function NotifyCard() {
  const s = useDoc(settingsDoc);
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'denied');
  const on = !!s.notify && perm === 'granted';
  const toggle = async () => {
    if (on) {
      await settingsDoc.update((x) => ({ ...x, notify: false }));
      await setBackgroundNews(false, 0);
      return toast('Avisos desactivados');
    }
    if (!notificationsSupported()) return toast(isIos() && !isStandalone() ? 'En iPhone primero instalá la app (Compartir → Agregar a inicio).' : 'Este navegador no permite avisos.', 'error');
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p !== 'granted') return toast('Sin permiso: activalo en los ajustes del navegador para Seoulmate.', 'error');
    await settingsDoc.update((x) => ({ ...x, notify: true }));
    await setBackgroundNews(true, Math.max(s.newsSeenAt ?? 0, s.newsNotifiedAt ?? 0) || Date.now());
    await showNotification('💜 Avisos activados', 'Te voy a avisar de cumpleaños, fechas especiales y novedades de BTS.', './#/fechas');
  };
  return (
    <section className="card soft">
      <div className="row spread">
        <div>
          <strong>Avisos</strong>
          <p className="tiny muted" style={{ margin: 0 }}>
            {on ? 'Activados: fechas de hoy y mañana, y noticias nuevas de BTS.' : 'Recibí avisos de cumpleaños, cartas, tareas y noticias de BTS.'}
          </p>
        </div>
        <button className={`btn sm ${on ? 'secondary' : ''}`} onClick={toggle} aria-pressed={on}>
          {on ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </section>
  );
}
