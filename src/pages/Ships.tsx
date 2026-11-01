import { useMemo, useState, type CSSProperties } from 'react';
import { useDoc } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { toast } from '../components/ui';
import {
  SHIP_ACTIONS, SHIP_MEMBERS, FORBIDDEN_NICKNAME_MSG, NICKNAME_MAX, actionLine, compatibility, displayName,
  isForbiddenNickname, joinNames, memberById, nicknamesOf, shipName, type ShipAction,
} from '../lib/ships';
import { ShipCharacter } from './ShipCharacter';
import './ships.css';

const FX_CHARS: Record<ShipAction['fx'], string[]> = {
  hearts: ['💜', '💗', '💕', '🩷', '💞'],
  notes: ['🎶', '🎵', '💜', '🎶'],
  rain: ['💧', '💧', '💧', '💜'],
  petals: ['🌸', '🌸', '💮', '💗'],
  stars: ['✨', '⭐', '🌟', '💫'],
  sparkles: ['✨', '💖', '✨', '💫'],
};

// ---------- Sección ----------
const ORDER = SHIP_MEMBERS.map((m) => m.id);

export function ShipsTab() {
  const data = useDoc(btsDoc);
  const nicks = data.nicknames;
  const [sel, setSel] = useState<string[]>(['jimin', 'jk']);
  const [action, setAction] = useState<ShipAction | null>(null);
  const [run, setRun] = useState(0);
  const [editing, setEditing] = useState(false);

  const members = sel.map((id) => memberById(id)!);
  const names = sel.map((id) => displayName(id, nicks));
  const n = sel.length;
  const group = n > 2;
  const line = action ? actionLine(action, names, run) : `Elegí qué hacen ${joinNames(names)} 💜`;
  const pct = compatibility(...sel);
  const size = Math.min(115, Math.floor(430 / n));

  const fx = useMemo(
    () =>
      action
        ? Array.from({ length: 14 + n * 2 }, (_, i) => ({
            ch: FX_CHARS[action.fx][i % FX_CHARS[action.fx].length],
            left: (i * 37 + run * 13) % 92,
            delay: (i % 7) * 0.22,
            dur: 2.2 + (i % 4) * 0.4,
          }))
        : [],
    [action, run, n],
  );

  const toggle = (id: string) => {
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
    setSel(ORDER.filter((x) => shuffled.includes(x)));
    doAction(SHIP_ACTIONS[Math.floor(Math.random() * SHIP_ACTIONS.length)]);
  };

  return (
    <div className="ships">
      <div className="card rose ship-head">
        <h2 className="ship-title">{shipName(...sel)} 💞</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Compatibilidad{group ? ' grupal' : ''}: <strong>{pct}%</strong> {pct > 94 ? '· almas gemelas 💍' : '· química total ✨'}
        </p>
      </div>

      <div className="ship-pickrow">
        <span className="small muted">Tocá a 2 o más ({n} elegidos)</span>
        <button type="button" className="btn sm secondary" onClick={() => { setSel([...ORDER]); setAction(null); }} disabled={n === 7}>
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
            <ShipCharacter m={m} size={40} mood="smile" bust />
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      <div
        key={run}
        className={`ship-stage scene-${action?.scene ?? 'stage'} ${action ? `move-${action.move} act-${action.id}` : ''} ${group ? 'is-group' : ''} ${n >= 5 ? 'is-crowd' : ''}`}
        data-testid="ship-stage"
      >
        <div className="ship-fx" aria-hidden="true">
          {fx.map((f, i) => (
            <span key={i} style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} className={`fx-${action?.fx}`}>
              {f.ch}
            </span>
          ))}
        </div>
        {action?.prop && <div className="ship-prop" aria-hidden="true">{action.prop}</div>}
        <div className="ship-mid" aria-hidden="true">{action ? action.emoji : '💜'}</div>
        <div className="ship-pair">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`ship-chibi ${i === 0 ? 'lead' : ''}`}
              style={{ '--off': (n - 1) / 2 - i, '--size': `${size}px`, animationDelay: action?.id === 'baile' || action?.id === 'abrazo' ? undefined : `${i * 0.06}s` } as CSSProperties}
            >
              <ShipCharacter m={m} mood={(i === 0 ? action?.moodA : action?.moodB) ?? 'smile'} size={size} />
              <span className="ship-name">{names[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="ship-line" aria-live="polite">{line}</p>

      <div className="ship-actions">
        {SHIP_ACTIONS.map((act) => (
          <button key={act.id} type="button" className={`ship-act ${action?.id === act.id ? 'on' : ''}`} onClick={() => doAction(act)}>
            <span className="ship-act-emoji">{act.emoji}</span>
            {group ? (GROUP_LABELS[act.id] ?? act.label) : act.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn rose block" onClick={surprise} style={{ marginTop: 10 }}>
        🎲 Ship sorpresa
      </button>

      <div className="card soft" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Apodos 🏷️</h3>
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

const GROUP_LABELS: Record<string, string> = {
  beso: 'Ronda de besos',
  mejilla: 'Ronda de besitos',
  abrazo: 'Abrazo grupal',
  mano: 'Ronda de la mano',
  cita: 'Cita grupal',
  baile: 'Baile en ronda',
  boda: 'Casamiento múltiple',
};

function NicknameEditor({ saved }: { saved: Record<string, string> | undefined }) {
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...nicknamesOf(saved) }));
  const [bad, setBad] = useState<string | null>(null);

  const save = async () => {
    const clean: Record<string, string> = {};
    for (const m of SHIP_MEMBERS) {
      const v = (draft[m.id] ?? '').trim().slice(0, NICKNAME_MAX);
      if (isForbiddenNickname(v)) {
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
