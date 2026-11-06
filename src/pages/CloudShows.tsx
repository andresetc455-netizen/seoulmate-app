// Pestaña "En la nube" de K-Drama Diary: dramas y capítulos de la carpeta de OneDrive compartida con ella.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDoc, newId, upsert } from '../lib/store';
import { dramaDoc, settingsDoc } from '../lib/docs';
import { clock, isDone } from '../lib/episodes';
import { loadLibrary, NotSignedIn, resumeLogin, signIn, signOut, streamUrl, subtitleText, type CloudEpisode, type CloudShow } from '../lib/onedrive';
import type { Drama } from '../lib/types';
import { Empty, toast } from '../components/ui';
import { VideoOverlay, type PlaySource } from './LocalPlayer';

const key = (ep: CloudEpisode) => `od:${ep.id}`;

/** Busca el drama por nombre o lo crea, para guardar ahí el progreso. */
async function ensureDrama(title: string): Promise<string> {
  const found = dramaDoc.get().dramas.find((d) => d.title.trim().toLowerCase() === title.trim().toLowerCase());
  if (found) return found.id;
  const now = Date.now();
  const d: Drama = {
    id: newId(), title, status: 'en-curso', genres: [], moods: [], rating: 0, review: '', characters: '', actors: '',
    episodeNotes: [], recommend: false, recommendNote: '', createdAt: now, updatedAt: now,
  };
  await dramaDoc.update((x) => ({ ...x, dramas: upsert(x.dramas, d) }));
  return d.id;
}

export function CloudShows() {
  const settings = useDoc(settingsDoc);
  const dramas = useDoc(dramaDoc).dramas;
  const clientId = settings.cloudClientId ?? '';
  const folder = settings.cloudFolder ?? '';
  const [signed, setSigned] = useState<boolean | null>(null);
  const [shows, setShows] = useState<CloudShow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ show: CloudShow; index: number; dramaId: string } | null>(null);

  const configured = !!clientId && !!folder;

  useEffect(() => {
    if (!configured) return;
    resumeLogin(clientId)
      .then((acc) => setSigned(!!acc))
      .catch(() => setSigned(false));
  }, [clientId, configured]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setShows(await loadLibrary(clientId, folder));
    } catch (e) {
      if (e instanceof NotSignedIn) setSigned(false);
      setError(e instanceof Error ? e.message : 'No se pudo leer la carpeta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signed) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signed]);

  const progressOf = (ep: CloudEpisode) => {
    for (const d of dramas) {
      const p = d.watched?.find((w) => w.key === key(ep));
      if (p) return p;
    }
    return undefined;
  };

  const play = async (show: CloudShow, index: number) => setPlaying({ show, index, dramaId: await ensureDrama(show.name) });

  if (!configured)
    return (
      <Empty
        title="Todavía no hay una carpeta conectada"
        text="Quien preparó Seoulmate tiene que pegar la carpeta de OneDrive en Ajustes → En la nube. Después vas a ver acá los capítulos para mirarlos sin descargarlos."
        action={<Link className="btn sm secondary" to="/ajustes">Ir a Ajustes</Link>}
      />
    );

  if (signed === false)
    return (
      <div className="card center cloud-hero">
        <span className="eyebrow">En la nube</span>
        <h3>Tus capítulos, en cualquier lugar</h3>
        <p className="small muted">Entrá con tu cuenta de Microsoft para ver los dramas que te compartieron. Solo se pide permiso de lectura.</p>
        <button
          className="btn"
          onClick={async () => {
            try {
              const acc = await signIn(clientId);
              if (acc) setSigned(true);
            } catch (e) {
              toast(e instanceof Error ? e.message : 'No se pudo iniciar sesión.', 'error');
            }
          }}
        >
          Entrar con Microsoft
        </button>
        {error && <p className="small" role="alert" style={{ marginTop: 10 }}>{error}</p>}
      </div>
    );

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <span className="small muted">{shows ? `${shows.length} ${shows.length === 1 ? 'drama' : 'dramas'} en la nube` : 'Conectando…'}</span>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn ghost sm" onClick={load} disabled={loading}>
            {loading ? 'Cargando…' : '↻ Actualizar'}
          </button>
          <button
            className="btn ghost sm"
            onClick={async () => {
              await signOut(clientId);
              setShows(null);
              setSigned(false);
            }}
          >
            Salir
          </button>
        </div>
      </div>
      {error && <p className="small" role="alert">{error}</p>}
      {loading && !shows && <div className="spinner" aria-label="Cargando" />}
      {shows && shows.length === 0 && <Empty title="La carpeta está vacía" text="Cuando suban capítulos (una carpeta por drama) van a aparecer acá." />}
      {shows?.map((show) => {
        const seen = show.episodes.filter((e) => {
          const p = progressOf(e);
          return p && isDone(p);
        }).length;
        const expanded = open === show.id;
        return (
          <section key={show.id} className="card cloud-show" data-testid="cloud-show">
            <button className="cloud-show-head" onClick={() => setOpen(expanded ? null : show.id)} aria-expanded={expanded}>
              <span className="grow">
                <span className="eyebrow" style={{ margin: 0 }}>{show.episodes.length} capítulos</span>
                <span className="cloud-title">{show.name}</span>
                {seen > 0 && <span className="tiny muted">Viste {seen} de {show.episodes.length}</span>}
              </span>
              <span className="cloud-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span>
            </button>
            {expanded && (
              <div className="local-list">
                {show.episodes.map((ep, i) => {
                  const p = progressOf(ep);
                  return (
                    <button key={ep.id} className="item local-ep" onClick={() => play(show, i)} data-testid="cloud-episode">
                      <span className="ep-num">{ep.ep ?? '·'}</span>
                      <span className="grow">
                        <span className="title" style={{ display: 'block' }}>{ep.ep ? `Capítulo ${ep.ep}` : ep.name}</span>
                        <span className="tiny muted">{p && isDone(p) ? 'Visto' : p ? `Quedaste en ${clock(p.time)}` : ep.subId ? 'Con subtítulos' : `${Math.round(ep.size / 1048576)} MB`}</span>
                      </span>
                      <span aria-hidden="true">▶</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
      {playing && <CloudOverlay clientId={clientId} {...playing} onIndex={(i) => setPlaying(i === null ? null : { ...playing, index: i })} />}
    </div>
  );
}

function CloudOverlay({ clientId, show, index, dramaId, onIndex }: { clientId: string; show: CloudShow; index: number; dramaId: string; onIndex: (i: number | null) => void }) {
  const ep = show.episodes[index];
  const source: PlaySource = useMemo(
    () => ({ key: key(ep), name: ep.name, ep: ep.ep, url: () => streamUrl(clientId, ep), subtitles: ep.subId ? () => subtitleText(clientId, ep) : undefined }),
    [clientId, ep],
  );
  return (
    <VideoOverlay
      key={source.key}
      dramaId={dramaId}
      dramaTitle={show.name}
      source={source}
      hasNext={index < show.episodes.length - 1}
      onNext={() => onIndex(index + 1)}
      onClose={() => onIndex(null)}
    />
  );
}
