// Noticias de BTS: giras, eventos, música y más, actualizadas cada pocas horas.
import { useEffect, useMemo, useState } from 'react';
import { useDoc } from '../lib/store';
import { settingsDoc } from '../lib/docs';
import { newsTime, TOPIC_LABEL, useNews, type NewsTopic } from '../lib/news';
import { MEMBER_FACTS } from '../lib/btsFacts';
import { Empty } from '../components/ui';

type Filter = 'todas' | NewsTopic | `m:${string}`;

export function NewsPage() {
  const settings = useDoc(settingsDoc);
  const { feed, loading, error, reload } = useNews();
  const [filter, setFilter] = useState<Filter>('todas');
  const [seenAt] = useState(settings.newsSeenAt ?? 0); // lo que había antes de entrar, para marcar "nuevo"

  // Al ver la lista, todo queda leído.
  useEffect(() => {
    if (!feed.items.length) return;
    const newest = Math.max(...feed.items.map((i) => Date.parse(i.date) || 0));
    if (newest > (settingsDoc.get().newsSeenAt ?? 0)) void settingsDoc.update((s) => ({ ...s, newsSeenAt: newest }));
  }, [feed]);

  const topics = useMemo(() => (Object.keys(TOPIC_LABEL) as NewsTopic[]).filter((t) => feed.items.some((i) => i.topics.includes(t))), [feed]);
  const members = useMemo(() => MEMBER_FACTS.map((m) => m.name).filter((n) => feed.items.some((i) => i.members.includes(n))), [feed]);
  const shown = feed.items.filter((i) => filter === 'todas' || (filter.startsWith('m:') ? i.members.includes(filter.slice(2)) : i.topics.includes(filter as NewsTopic)));

  return (
    <div className="page">
      <div className="row spread" style={{ marginBottom: 8 }}>
        <span className="small muted">
          {feed.updatedAt ? `Actualizado ${newsTime(feed.updatedAt)}` : 'Titulares de medios públicos'}
        </span>
        <button className="btn ghost sm" onClick={reload} disabled={loading}>
          {loading ? 'Cargando…' : '↻ Actualizar'}
        </button>
      </div>
      {error && (
        <p className="small" role="alert">
          {error}
        </p>
      )}
      {feed.items.length > 0 && (
        <div className="chips" style={{ marginBottom: 12 }}>
          <button className="chip" aria-pressed={filter === 'todas'} onClick={() => setFilter('todas')}>
            Todas
          </button>
          {topics.map((t) => (
            <button key={t} className="chip" aria-pressed={filter === t} onClick={() => setFilter(t)}>
              {TOPIC_LABEL[t]}
            </button>
          ))}
          {members.map((m) => (
            <button key={m} className="chip" aria-pressed={filter === `m:${m}`} onClick={() => setFilter(`m:${m}`)}>
              {m}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 && !loading ? (
        <Empty title="Sin noticias por ahora" text="Las noticias se actualizan solas cada 3 horas. Volvé en un rato." />
      ) : (
        shown.slice(0, 80).map((n) => (
          <a key={n.id} className="item news-item" href={n.link} target="_blank" rel="noreferrer" data-testid="news">
            <div className="grow">
              <div className="title">
                {Date.parse(n.date) > seenAt && seenAt > 0 && <span className="tag rose" style={{ marginRight: 6 }}>Nuevo</span>}
                {n.title}
              </div>
              <div className="tiny muted">
                {n.source} · {newsTime(n.date)} · {TOPIC_LABEL[n.topics[0]]}
              </div>
            </div>
            <span aria-hidden="true">↗</span>
          </a>
        ))
      )}
      <p className="tiny muted center" style={{ marginTop: 16 }}>
        Los titulares vienen de Google News y portales de K-pop; se abren en el sitio original.
      </p>
    </div>
  );
}
