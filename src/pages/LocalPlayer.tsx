// Reproductor de capítulos guardados en el teléfono. Los archivos se leen en el momento y nunca se suben
// ni se copian: solo se guarda el progreso (qué capítulo y en qué minuto quedó) dentro del drama.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { dramaDoc } from '../lib/docs';
import { upsert } from '../lib/store';
import { clock, fileKey, isDone, parseEpisode, resumeAt, sameBase, sortEpisodes, srtToVtt } from '../lib/episodes';
import type { Drama, WatchProgress } from '../lib/types';
import { toast } from '../components/ui';

const MAX_PROGRESS = 80;

function saveProgress(dramaId: string, p: WatchProgress) {
  return dramaDoc.update((d) => {
    const drama = d.dramas.find((x) => x.id === dramaId);
    if (!drama) return d;
    const list = [p, ...(drama.watched ?? []).filter((x) => x.key !== p.key)].slice(0, MAX_PROGRESS);
    const status = drama.status === 'pendiente' ? 'en-curso' : drama.status;
    return { ...d, dramas: upsert(d.dramas, { ...drama, status, watched: list, updatedAt: Date.now() }) };
  });
}

/** Resumen del progreso: último capítulo visto y cuántos terminó. */
export function WatchSummary({ drama }: { drama: Drama }) {
  const w = drama.watched ?? [];
  if (!w.length) return null;
  const last = w[0];
  const done = w.filter(isDone).length;
  return (
    <p className="tiny muted" style={{ margin: '6px 0 0' }} data-testid="watch-summary">
      Último: {last.ep ? `capítulo ${last.ep}` : last.name} · {clock(last.time)} de {clock(last.duration)}
      {done ? ` · ${done} ${done === 1 ? 'capítulo terminado' : 'capítulos terminados'}` : ''}
    </p>
  );
}

function LocalOverlay({ drama, files, subs, index, onIndex }: { drama: Drama; files: File[]; subs: File[]; index: number; onIndex: (i: number | null) => void }) {
  const file = files[index];
  const sub = subs.find((s) => sameBase(s.name, file.name)) ?? (files.length === 1 && subs.length === 1 ? subs[0] : undefined);
  const source = useMemo(() => localSource(file, sub), [file, sub]);
  return (
    <VideoOverlay
      key={source.key}
      dramaId={drama.id}
      dramaTitle={drama.title}
      source={source}
      hasNext={index < files.length - 1}
      onNext={() => onIndex(index + 1)}
      onClose={() => onIndex(null)}
    />
  );
}

export function LocalEpisodes({ drama }: { drama: Drama }) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [subs, setSubs] = useState<File[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);

  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    const all = Array.from(list);
    const videos = sortEpisodes(all.filter((f) => f.type.startsWith('video/') || /\.(mp4|m4v|mkv|webm|mov)$/i.test(f.name)));
    setSubs(all.filter((f) => /\.(srt|vtt)$/i.test(f.name)));
    if (!videos.length) return toast('Elegí archivos de video (MP4 funciona en todos los teléfonos).', 'error');
    setFiles(videos);
    if (input.current) input.current.value = '';
    // Si eligió un solo capítulo, arranca directo.
    if (videos.length === 1) setPlaying(0);
  };

  const progressOf = (f: File) => (drama.watched ?? []).find((x) => x.key === fileKey(f));

  return (
    <div className="card soft local-eps">
      <span className="eyebrow">En este teléfono</span>
      <div className="row spread">
        <strong>Capítulos descargados</strong>
        <button className="btn sm" onClick={() => input.current?.click()}>
          Elegir capítulos
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="video/*,.mkv,.srt,.vtt"
        multiple
        hidden
        data-testid="local-episodes-input"
        aria-label="Elegir capítulos del teléfono"
        onChange={(e) => pick(e.target.files)}
      />
      <p className="tiny muted" style={{ margin: '6px 0 0' }}>
        Se reproducen desde el teléfono, sin subirse a ningún lado. Podés elegir varios capítulos juntos y, si tenés subtítulos .srt con el mismo nombre, también.
      </p>
      <WatchSummary drama={drama} />
      {files.length > 1 && (
        <div className="local-list">
          {files.map((f, i) => {
            const p = progressOf(f);
            const done = p && isDone(p);
            return (
              <button key={fileKey(f)} className="item local-ep" onClick={() => setPlaying(i)} data-testid="local-episode">
                <span className="ep-num">{parseEpisode(f.name) ?? '·'}</span>
                <span className="grow">
                  <span className="title" style={{ display: 'block' }}>{f.name}</span>
                  <span className="tiny muted">{done ? 'Visto' : p ? `Quedaste en ${clock(p.time)}` : `${(f.size / 1048576).toFixed(0)} MB`}</span>
                </span>
                <span aria-hidden="true">▶</span>
              </button>
            );
          })}
        </div>
      )}
      {playing !== null && files[playing] && (
        <LocalOverlay drama={drama} files={files} subs={subs} index={playing} onIndex={setPlaying} />
      )}
    </div>
  );
}

/** Lo que el reproductor necesita de un capítulo, venga del teléfono o de la nube. */
export interface PlaySource {
  key: string;
  name: string;
  ep: number | null;
  url: () => Promise<string>;
  subtitles?: () => Promise<string | null>; // texto .srt o .vtt
}

export function localSource(file: File, sub?: File): PlaySource {
  return {
    key: fileKey(file),
    name: file.name,
    ep: parseEpisode(file.name),
    url: async () => URL.createObjectURL(file),
    subtitles: sub ? () => sub.text() : undefined,
  };
}

export function VideoOverlay({ dramaId, dramaTitle, source, hasNext, onNext, onClose, fallback }: { dramaId: string; dramaTitle: string; source: PlaySource; hasNext: boolean; onNext: () => void; onClose: () => void; fallback?: React.ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [vtt, setVtt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lastSaved = useRef(0);

  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    source
      .url()
      .then((u) => {
        made = u;
        if (alive) setUrl(u);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'No se pudo abrir el capítulo.'));
    void source.subtitles?.().then((t) => {
      if (!alive || !t) return;
      const v = URL.createObjectURL(new Blob([srtToVtt(t)], { type: 'text/vtt' }));
      setVtt(v);
    });
    return () => {
      alive = false;
      if (made?.startsWith('blob:')) URL.revokeObjectURL(made);
    };
  }, [source]);
  useEffect(() => () => {
    if (vtt) URL.revokeObjectURL(vtt);
  }, [vtt]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const store = (force = false) => {
    const v = video.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    const now = Date.now();
    if (!force && now - lastSaved.current < 5000) return;
    lastSaved.current = now;
    void saveProgress(dramaId, { key: source.key, name: source.name, ep: source.ep, time: v.currentTime, duration: v.duration, at: now });
  };

  const onLoaded = () => {
    const v = video.current;
    if (!v) return;
    const prev = (dramaDoc.get().dramas.find((d) => d.id === dramaId)?.watched ?? []).find((x) => x.key === source.key);
    const t = prev ? resumeAt(prev.time, v.duration) : null;
    if (t !== null) {
      v.currentTime = t;
      toast(`Seguís desde ${clock(t)}`);
    }
    void v.play().catch(() => undefined);
  };

  const close = () => {
    store(true);
    onClose();
  };

  return createPortal(
    <div className="video-overlay" role="dialog" aria-modal="true" aria-label={`Reproduciendo ${source.name}`}>
      <header className="video-top">
        <button className="btn ghost sm" onClick={close} style={{ color: '#fbf1ec' }}>
          ✕ Cerrar
        </button>
        <div className="grow" style={{ minWidth: 0 }}>
          <span className="eyebrow" style={{ margin: 0 }}>{dramaTitle}</span>
          <div className="video-name">{source.ep ? `Capítulo ${source.ep}` : source.name}</div>
        </div>
        {hasNext && (
          <button className="btn sm secondary" onClick={() => (store(true), onNext())}>
            Siguiente
          </button>
        )}
      </header>
      {error && fallback ? (
        fallback
      ) : error ? (
        <div className="video-error">
          <p>{error}</p>
          <p className="small">Si el formato no es compatible, convertilo a MP4 (H.264).</p>
        </div>
      ) : !url ? (
        <div className="video-error">
          <div className="spinner" aria-label="Cargando" />
        </div>
      ) : (
        <video
          ref={video}
          src={url}
          controls
          playsInline
          preload="metadata"
          crossOrigin={url.startsWith('blob:') ? undefined : 'anonymous'}
          onLoadedMetadata={onLoaded}
          onTimeUpdate={() => store()}
          onPause={() => store(true)}
          onEnded={() => {
            store(true);
            if (hasNext) onNext();
          }}
          onError={() => setError('Este teléfono no puede reproducir este formato de video.')}
          data-testid="local-video"
        >
          {vtt && <track kind="subtitles" src={vtt} srcLang="es" label="Español" default />}
        </video>
      )}
    </div>,
    document.body,
  );
}
