// Galería libre de fotos reales (Wikimedia Commons): elegir favoritas y guardarlas como photocards.
import { useEffect, useState } from 'react';
import { useDoc, newId, upsert } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { saveImageFile } from '../lib/media';
import { downloadPhoto, GALLERY_FILTERS, searchCommons, type CommonsPhoto } from '../lib/commons';
import type { FrameStyle, GalleryPick } from '../lib/types';
import { Empty, Modal, toast } from '../components/ui';

const FRAMES: Array<{ id: FrameStyle; label: string }> = [
  { id: 'holo', label: 'Holo' },
  { id: 'estrellas', label: 'Estrellas' },
  { id: 'cerezo', label: 'Cerezo' },
  { id: 'encaje', label: 'Encaje' },
  { id: 'polaroid', label: 'Polaroid' },
];

export function FreeGallery() {
  const bts = useDoc(btsDoc);
  const picks = bts.gallery ?? [];
  const [filter, setFilter] = useState<string>('favs');
  const [photos, setPhotos] = useState<CommonsPhoto[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<CommonsPhoto | null>(null);

  const load = async (f: string, offset = 0) => {
    setLoading(true);
    setError('');
    try {
      const r = await searchCommons(f, offset);
      setPhotos((prev) => {
        const all = offset ? [...prev, ...r.photos] : r.photos;
        return all.filter((p, i) => all.findIndex((x) => x.id === p.id) === i);
      });
      setNext(r.next);
    } catch {
      setError(navigator.onLine ? 'No se pudo cargar la galería. Probá de nuevo en un rato.' : 'Sin conexión: la galería necesita internet. Tus favoritas guardadas sí se ven.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== 'favs') void load(filter);
  }, [filter]);

  const isFav = (id: string) => picks.some((p) => p.id === id);
  const memberOf = (f: string) => (f === 'bts' || f === 'favs' ? '' : f);
  const toggleFav = (p: CommonsPhoto) =>
    btsDoc.update((d) => {
      const list = d.gallery ?? [];
      if (list.some((x) => x.id === p.id)) return { ...d, gallery: list.filter((x) => x.id !== p.id) };
      const pick: GalleryPick = { id: p.id, member: memberOf(filter), thumb: p.thumb, page: p.page, author: p.author, license: p.license, savedAt: Date.now() };
      return { ...d, gallery: [pick, ...list] };
    });

  const shown: CommonsPhoto[] =
    filter === 'favs' ? picks.map((p) => ({ id: p.id, thumb: p.thumb, page: p.page, author: p.author, license: p.license, description: '' })) : photos;

  return (
    <div>
      <p className="small muted" style={{ marginTop: 0 }}>
        Fotos reales con licencia libre de Wikimedia Commons. Tocá ♡ para guardar tus favoritas o convertilas en photocard.
      </p>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button className="chip" aria-pressed={filter === 'favs'} onClick={() => setFilter('favs')}>
          ♥ Mis favoritas ({picks.length})
        </button>
        {GALLERY_FILTERS.map((f) => (
          <button key={f.id} className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {error && <p className="small" role="alert">{error}</p>}
      {shown.length === 0 && !loading ? (
        filter === 'favs' ? (
          <Empty title="Todavía no elegiste favoritas" text="Elegí un integrante arriba y tocá ♡ en las fotos que más te gusten." />
        ) : (
          !error && <Empty title="No encontramos fotos" text="Probá con otro integrante." />
        )
      ) : (
        <div className="gal-grid" data-testid="gallery">
          {shown.map((p) => (
            <div key={p.id} className="gal-item">
              <button className="gal-img" onClick={() => setView(p)} aria-label="Ver foto">
                <img src={p.thumb} alt={p.description || p.id.replace(/^File:|\.\w+$/g, '')} loading="lazy" referrerPolicy="no-referrer" />
              </button>
              <button className={`gal-fav ${isFav(p.id) ? 'on' : ''}`} aria-pressed={isFav(p.id)} aria-label="Favorita" onClick={() => toggleFav(p)}>
                {isFav(p.id) ? '♥' : '♡'}
              </button>
            </div>
          ))}
        </div>
      )}
      {loading && <div className="spinner" aria-label="Cargando" />}
      {filter !== 'favs' && next !== null && !loading && (
        <button className="btn secondary block" style={{ marginTop: 12 }} onClick={() => load(filter, next)}>
          Ver más fotos
        </button>
      )}
      {view && <PhotoView photo={view} defaultMember={memberOf(filter) || picks.find((x) => x.id === view.id)?.member || ''} fav={isFav(view.id)} onFav={() => toggleFav(view)} onClose={() => setView(null)} />}
    </div>
  );
}

function PhotoView({ photo, defaultMember, fav, onFav, onClose }: { photo: CommonsPhoto; defaultMember: string; fav: boolean; onFav: () => void; onClose: () => void }) {
  const { members } = useDoc(btsDoc);
  const [frame, setFrame] = useState<FrameStyle>('holo');
  const [member, setMember] = useState(defaultMember);
  const [busy, setBusy] = useState(false);
  const makeCard = async () => {
    setBusy(true);
    try {
      const imageId = await saveImageFile(await downloadPhoto(photo));
      await btsDoc.update((d) => ({
        ...d,
        photocards: upsert(d.photocards, {
          id: newId(),
          imageId,
          caption: `Foto: ${photo.author} (${photo.license})`.slice(0, 120),
          member,
          collection: 'Galería libre',
          frame,
          favorite: true,
          createdAt: Date.now(),
        }),
      }));
      toast('Photocard creada: está en tu carpeta');
      onClose();
    } catch {
      toast('No se pudo descargar la foto. Igual podés guardarla como favorita.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Foto" onClose={onClose}>
      <img src={photo.thumb} alt="" style={{ width: '100%', borderRadius: 14, display: 'block' }} referrerPolicy="no-referrer" />
      <p className="tiny muted" style={{ margin: '6px 0 10px' }}>
        {photo.author} · {photo.license} ·{' '}
        <a href={photo.page} target="_blank" rel="noreferrer">
          ver en Commons
        </a>
      </p>
      <button className="btn secondary block" onClick={onFav}>
        {fav ? '♥ Quitar de favoritas' : '♡ Guardar en favoritas'}
      </button>
      <h3 style={{ margin: '14px 0 6px' }}>Convertir en photocard</h3>
      <div className="chips" style={{ marginBottom: 8 }}>
        {FRAMES.map((f) => (
          <button key={f.id} className="chip" aria-pressed={frame === f.id} onClick={() => setFrame(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <label className="small">
        Integrante{' '}
        <select value={member} onChange={(e) => setMember(e.target.value)}>
          <option value="">BTS / sin indicar</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <button className="btn block" style={{ marginTop: 10 }} onClick={makeCard} disabled={busy}>
        {busy ? 'Guardando…' : 'Crear photocard'}
      </button>
    </Modal>
  );
}
