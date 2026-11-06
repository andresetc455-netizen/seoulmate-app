import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useDoc, newId } from '../lib/store';
import { btsDoc, petDoc } from '../lib/docs';
import { deleteMedia, getMediaData, saveMediaData } from '../lib/media';
import { renderMoment, shareImage } from '../lib/moment';
import { DeleteButton, MediaImg, Modal, toast } from '../components/ui';
import { Cat } from '../components/Cat';
import {
  BTS_IDS, SHIP_ACTIONS, SHIP_MEMBERS, FORBIDDEN_NICKNAME_MSG, NICKNAME_MAX, actionLine, compatibility, displayName,
  groupKey, isForbiddenNickname, joinNames, memberById, nicknamesOf, shipName, type ShipAction,
} from '../lib/ships';
import type { ShipMoment } from '../lib/types';
import { ShipFigure } from './ShipChar';
import './ships.css';

// Partículas vectoriales (sin emojis) en la paleta de la app.
const FX_SHAPES: Record<ShipAction['fx'], string[]> = {
  hearts: ['heart', 'heart', 'dot'],
  notes: ['note', 'dot', 'note'],
  rain: ['drop', 'drop', 'drop'],
  petals: ['petal', 'petal', 'dot'],
  stars: ['spark', 'dot', 'spark'],
  sparkles: ['spark', 'heart', 'dot'],
};
const FX_COLORS = ['#b56f7c', '#d9a7b0', '#b48d55', '#c7bbdc', '#8e3a50'];

function FxShape({ kind, color }: { kind: string; color: string }) {
  const d: Record<string, string> = {
    heart: 'M12 21s-7-4.6-9.3-9C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h2.6C14.1 6.1 15.5 5 17.5 5 21 5 23 8.6 21.3 12 19 16.4 12 21 12 21z',
    petal: 'M12 3c4 4 5 9 0 18C7 12 8 7 12 3z',
    spark: 'M12 2l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z',
    drop: 'M12 3c3 5 6 8.5 6 12a6 6 0 0 1-12 0c0-3.5 3-7 6-12z',
    note: 'M9 18a3 3 0 1 1-2-2.8V5l11-2v11a3 3 0 1 1-2-2.8V6.3L9 7.6z',
    dot: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  };
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em">
      <path d={d[kind]} fill={color} opacity={kind === 'drop' ? 0.55 : 0.85} />
    </svg>
  );
}

/** Quita emojis de los textos de las acciones para un acabado más sobrio. */
const plain = (t: string) => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();

const ORDER = SHIP_MEMBERS.map((m) => m.id);

export function ShipsTab() {
  const data = useDoc(btsDoc);
  const pet = useDoc(petDoc);
  const nicks = data.nicknames;
  const favs = data.shipFavs ?? [];
  const moments = data.shipMoments ?? [];
  const [sel, setSel] = useState<string[]>(['jimin', 'jk']);
  const [action, setAction] = useState<ShipAction | null>(null);
  const [run, setRun] = useState(0);
  const [editing, setEditing] = useState(false);
  const [withCat, setWithCat] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<ShipMoment | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const members = sel.map((id) => memberById(id)!);
  const names = sel.map((id) => displayName(id, nicks));
  const n = sel.length;
  const group = n > 2;
  const title = shipName(...sel);
  const line = plain(action ? actionLine(action, names, run) : `Elegí qué hacen ${joinNames(names)}`);
  const pct = compatibility(...sel);
  const size = Math.min(172, Math.floor(540 / n));
  const isFav = favs.some((f) => groupKey(f) === groupKey(sel));
  const scene = action?.scene ?? 'stage';
  const showCat = withCat && pet.adopted;

  const fx = useMemo(
    () =>
      action
        ? Array.from({ length: 14 + n * 2 }, (_, i) => ({
            kind: FX_SHAPES[action.fx][i % 3],
            color: FX_COLORS[(i + run) % FX_COLORS.length],
            left: (i * 37 + run * 13) % 92,
            delay: (i % 7) * 0.22,
            dur: 2.2 + (i % 4) * 0.4,
          }))
        : [],
    [action, run, n],
  );

  const toggle = (id: string) => {
    // Nicole solo va en un ship si está Andrés.
    if (id === 'andres' && sel.includes('andres') && sel.includes('nicole')) {
      toast(FORBIDDEN_NICKNAME_MSG, 'error');
      return;
    }
    if (id === 'nicole' && !sel.includes('nicole') && !sel.includes('andres')) {
      toast(FORBIDDEN_NICKNAME_MSG, 'error');
      setSel(ORDER.filter((x) => x === 'nicole' || x === 'andres' || sel.includes(x)));
      setAction(null);
      return;
    }
    if (sel.includes(id)) {
      if (n <= 2) {
        toast('Un ship necesita al menos dos 💜');
        return;
      }
      setSel(sel.filter((x) => x !== id));
    } else setSel(ORDER.filter((x) => x === id || sel.includes(x)));
    setAction(null);
  };

  const doAction = (act: ShipAction) => {
    setAction(act);
    setRun((r) => r + 1);
  };

  const surprise = () => {
    const k = Math.random() < 0.15 ? 7 : 2 + Math.floor(Math.random() * 3);
    const shuffled = [...ORDER].sort(() => Math.random() - 0.5).slice(0, k);
    if (shuffled.includes('nicole') && !shuffled.includes('andres')) shuffled.push('andres');
    setSel(ORDER.filter((x) => shuffled.includes(x)));
    doAction(SHIP_ACTIONS[Math.floor(Math.random() * SHIP_ACTIONS.length)]);
  };

  const toggleFav = () =>
    btsDoc.update((d) => {
      const list = d.shipFavs ?? [];
      const k = groupKey(sel);
      return { ...d, shipFavs: list.some((f) => groupKey(f) === k) ? list.filter((f) => groupKey(f) !== k) : [[...sel], ...list].slice(0, 30) };
    });

  const saveMoment = async () => {
    if (!stage.current) return;
    setSaving(true);
    try {
      const url = await renderMoment(stage.current, scene, title, line);
      const imageId = newId();
      await saveMediaData(imageId, url);
      const mo: ShipMoment = { id: newId(), imageId, title, line, createdAt: Date.now() };
      await btsDoc.update((d) => ({ ...d, shipMoments: [mo, ...(d.shipMoments ?? [])].slice(0, 120) }));
      toast('Momento guardado');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar el momento', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ships">
      <div className="card rose ship-head">
        <button type="button" className={`ship-fav ${isFav ? 'on' : ''}`} aria-pressed={isFav} aria-label={isFav ? 'Quitar de mis ships' : 'Guardar en mis ships'} onClick={toggleFav}>
          {isFav ? '★' : '☆'}
        </button>
        <span className="eyebrow">Ship del momento</span>
        <h2 className="ship-title">{title}</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Compatibilidad{group ? ' grupal' : ''}: <strong>{pct}%</strong> {pct > 94 ? '· almas gemelas' : '· química total'}
        </p>
      </div>

      {favs.length > 0 && (
        <div className="chips ship-favs" aria-label="Mis ships">
          {favs.map((f) => (
            <button
              key={groupKey(f)}
              type="button"
              className="chip"
              aria-pressed={groupKey(f) === groupKey(sel)}
              onClick={() => {
                setSel(ORDER.filter((x) => f.includes(x)));
                setAction(null);
              }}
            >
              ★ {shipName(...ORDER.filter((x) => f.includes(x)))}
            </button>
          ))}
        </div>
      )}

      <div className="ship-pickrow">
        <span className="small muted">Tocá a 2 o más ({n} elegidos)</span>
        <button type="button" className="btn sm secondary" onClick={() => { setSel([...BTS_IDS]); setAction(null); }} disabled={sel.join() === BTS_IDS.join()}>
          Todos (OT7)
        </button>
      </div>
      <div className="ship-picker" role="group" aria-label="Integrantes del ship">
        {SHIP_MEMBERS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={sel.includes(m.id)}
            aria-label={displayName(m.id, nicks)}
            className={`ship-pick ${sel.includes(m.id) ? 'on' : ''}`}
            onClick={() => toggle(m.id)}
          >
            <ShipFigure m={m} size={40} head />
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      <div
        key={run}
        ref={stage}
        className={`ship-stage scene-${scene} ${action ? `move-${action.move} act-${action.id}` : ''} ${group ? 'is-group' : ''} ${n >= 5 ? 'is-crowd' : ''}`}
        data-testid="ship-stage"
      >
        <div className="ship-fx" aria-hidden="true">
          {fx.map((f, i) => (
            <span key={i} style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} className={`fx-${action?.fx}`}>
              <FxShape kind={f.kind} color={f.color} />
            </span>
          ))}
        </div>
        {action?.move === 'touch' && (
          <div className="ship-mid" aria-hidden="true">
            <FxShape kind="heart" color="#b56f7c" />
          </div>
        )}
        <div className="ship-pair">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`ship-chibi ${i === 0 ? 'lead' : ''}`}
              style={{ '--off': (n - 1) / 2 - i, '--size': `${size}px`, animationDelay: action?.id === 'baile' || action?.id === 'abrazo' ? undefined : `${i * 0.06}s` } as CSSProperties}
            >
              <span data-snap-wrap>
                <ShipFigure m={m} mood={(i === 0 ? action?.moodA : action?.moodB) ?? 'happy'} size={size} />
              </span>
              <span className="ship-name" data-snap="label">{names[i]}</span>
            </div>
          ))}
        </div>
        {showCat && (
          <div className="ship-cat" aria-label={`${pet.name} en la escena`}>
            <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={action?.cat ?? 'idle'} size={n >= 5 ? 54 : 66} />
          </div>
        )}
      </div>
      <p className="ship-line" aria-live="polite">{line}</p>

      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
        <button type="button" className="btn secondary grow" onClick={saveMoment} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar momento'}
        </button>
        {pet.adopted && (
          <button type="button" className="btn ghost" aria-pressed={withCat} onClick={() => setWithCat((c) => !c)}>
            {withCat ? `Sin ${pet.name}` : `Con ${pet.name}`}
          </button>
        )}
      </div>

      <div className="ship-actions">
        {SHIP_ACTIONS.map((act) => (
          <button key={act.id} type="button" className={`ship-act ${action?.id === act.id ? 'on' : ''}`} onClick={() => doAction(act)}>
            {group ? (GROUP_LABELS[act.id] ?? act.label) : act.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn rose block" onClick={surprise} style={{ marginTop: 10 }}>
        Ship sorpresa
      </button>

      <div className="card soft" style={{ marginTop: 16 }}>
        <span className="eyebrow">Álbum</span>
        <h3 style={{ margin: '0 0 10px' }}>Momentos</h3>
        {moments.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>Elegí una acción y tocá «Guardar momento» para armar tu álbum de escenas.</p>
        ) : (
          <div className="moment-grid" data-testid="moments">
            {moments.map((mo) => (
              <button key={mo.id} type="button" onClick={() => setView(mo)} aria-label={`Ver momento ${mo.title}`}>
                <MediaImg id={mo.imageId} alt={mo.title} />
              </button>
            ))}
          </div>
        )}
      </div>
      {view && <MomentView mo={view} onClose={() => setView(null)} />}

      <div className="card soft" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Apodos</h3>
          <button type="button" className="btn sm secondary" onClick={() => setEditing((e) => !e)}>
            {editing ? 'Cerrar' : 'Editar'}
          </button>
        </div>
        {editing ? <NicknameEditor saved={nicks} /> : (
          <p className="small muted" style={{ marginBottom: 0 }}>Ponele a cada uno el apodo que quieras.</p>
        )}
      </div>
    </div>
  );
}

function MomentView({ mo, onClose }: { mo: ShipMoment; onClose: () => void }) {
  const share = async () => {
    const url = await getMediaData(mo.imageId);
    if (!url) return toast('La imagen no está disponible', 'error');
    const r = await shareImage(url, `seoulmate-${mo.title.replace(/\W+/g, '-').toLowerCase()}.jpg`, `${mo.title} · ${mo.line}`);
    if (r === 'downloaded') toast('Imagen descargada 📥');
  };
  const remove = async () => {
    await deleteMedia(mo.imageId);
    await btsDoc.update((d) => ({ ...d, shipMoments: (d.shipMoments ?? []).filter((x) => x.id !== mo.id) }));
    onClose();
  };
  return (
    <Modal title={mo.title} onClose={onClose}>
      <MediaImg id={mo.imageId} alt={mo.title} style={{ width: '100%', borderRadius: 14, display: 'block' }} />
      <p className="tiny muted" style={{ margin: '6px 0 10px' }}>{new Date(mo.createdAt).toLocaleString('es')}</p>
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn grow" onClick={share}>
          Compartir
        </button>
        <DeleteButton onConfirm={remove} />
      </div>
    </Modal>
  );
}

const GROUP_LABELS: Record<string, string> = {
  beso: 'Ronda de besos',
  mejilla: 'Ronda de besitos',
  abrazo: 'Abrazo grupal',
  mano: 'Ronda de la mano',
  cita: 'Cita grupal',
  baile: 'Baile en ronda',
  boda: 'Casamiento múltiple',
  selfie: 'Selfie grupal',
  cabina: 'Fotocabina grupal',
};

function NicknameEditor({ saved }: { saved: Record<string, string> | undefined }) {
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...nicknamesOf(saved) }));
  const [bad, setBad] = useState<string | null>(null);

  const save = async () => {
    const clean: Record<string, string> = {};
    for (const m of SHIP_MEMBERS) {
      const v = (draft[m.id] ?? '').trim().slice(0, NICKNAME_MAX);
      if (m.id !== 'andres' && isForbiddenNickname(v)) {
        setBad(m.id);
        toast(FORBIDDEN_NICKNAME_MSG, 'error');
        return;
      }
      if (v) clean[m.id] = v;
    }
    setBad(null);
    await btsDoc.update((d) => ({ ...d, nicknames: clean }));
    toast('Apodos guardados 💜');
  };

  return (
    <form
      className="nick-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {SHIP_MEMBERS.map((m) => (
        <label key={m.id} className="nick-row">
          <span className="nick-label">{m.emoji} {m.name}</span>
          <input
            className="input"
            value={draft[m.id] ?? ''}
            maxLength={NICKNAME_MAX}
            placeholder={m.name}
            aria-invalid={bad === m.id}
            onChange={(e) => {
              setDraft({ ...draft, [m.id]: e.target.value });
              if (bad === m.id) setBad(null);
            }}
          />
          {bad === m.id && <span className="nick-error" role="alert">{FORBIDDEN_NICKNAME_MSG}</span>}
        </label>
      ))}
      <button type="submit" className="btn block">Guardar apodos</button>
    </form>
  );
}
