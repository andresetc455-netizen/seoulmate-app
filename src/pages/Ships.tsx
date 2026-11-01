import { useMemo, useState, type CSSProperties } from 'react';
import { useDoc } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { toast } from '../components/ui';
import {
  BTS_IDS, SHIP_ACTIONS, SHIP_MEMBERS, FORBIDDEN_NICKNAME_MSG, NICKNAME_MAX, actionLine, compatibility, displayName,
  isForbiddenNickname, joinNames, memberById, nicknamesOf, shipName, type Mood, type ShipAction, type ShipMember,
} from '../lib/ships';
import './ships.css';

// ---------- Chibi dibujado en SVG (caricatura, sin fotos) ----------
function Hair({ m }: { m: ShipMember }) {
  const c = m.hair;
  switch (m.style) {
    case 'side':
      return <path d="M14 46 Q14 12 50 12 Q86 12 86 46 Q74 30 52 28 Q34 34 14 46Z" fill={c} />;
    case 'curtain':
      return <path d="M14 50 Q12 12 50 12 Q88 12 86 50 Q80 34 66 30 Q58 40 50 30 Q42 40 34 30 Q20 34 14 50Z" fill={c} />;
    case 'spiky':
      return <path d="M14 46 L20 18 L30 26 L38 10 L48 22 L58 8 L66 22 L76 12 L80 28 L86 46 Q70 30 50 30 Q30 30 14 46Z" fill={c} />;
    case 'curly':
      return (
        <g fill={c}>
          <path d="M14 48 Q12 14 50 12 Q88 14 86 48 Q78 34 50 32 Q22 34 14 48Z" />
          {[[18, 36], [22, 24], [32, 16], [44, 11], [56, 11], [68, 16], [78, 24], [82, 36], [30, 30], [42, 26], [54, 26], [66, 30]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={8} />
          ))}
        </g>
      );
    case 'long':
      return <path d="M14 50 Q12 12 50 12 Q88 12 86 50 Q80 34 66 31 L62 40 L56 30 L50 36 L44 30 L38 40 L34 31 Q20 34 14 50Z" fill={c} />;
    case 'bowl':
      return <path d="M13 50 Q12 12 50 12 Q88 12 87 50 Q86 36 80 36 L20 36 Q14 36 13 50Z" fill={c} />;
    default:
      return (
        <g fill={c}>
          <path d="M14 48 Q12 14 50 12 Q88 14 86 48 Q78 32 62 34 Q56 28 50 34 Q44 28 38 34 Q22 32 14 48Z" />
          <circle cx="26" cy="22" r="10" />
          <circle cx="50" cy="14" r="10" />
          <circle cx="74" cy="22" r="10" />
        </g>
      );
  }
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'love')
    return (
      <g fill="#e2577f">
        <path d="M33 50 q-4-5 0-7 q2-1 3 1 q1-2 3-1 q4 2 0 7 l-3 3z" />
        <path d="M61 50 q-4-5 0-7 q2-1 3 1 q1-2 3-1 q4 2 0 7 l-3 3z" />
      </g>
    );
  if (mood === 'kiss' || mood === 'happy')
    return (
      <g stroke="#3d3350" strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d={mood === 'kiss' ? 'M31 49 q5 3 10 0' : 'M31 50 q5-5 10 0'} />
        <path d={mood === 'kiss' ? 'M59 49 q5 3 10 0' : 'M59 50 q5-5 10 0'} />
      </g>
    );
  return (
    <g fill="#3d3350">
      <ellipse cx="36" cy="49" rx="4" ry="5" />
      <ellipse cx="64" cy="49" rx="4" ry="5" />
      <circle cx="37.5" cy="47" r="1.4" fill="#fff" />
      <circle cx="65.5" cy="47" r="1.4" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'kiss') return <path d="M47 63 q4-3 6 0 q-2 2 0 4 q-3 3-6 0" fill="#e2577f" />;
  if (mood === 'blush') return <path d="M45 63 q5 3 10 0" stroke="#3d3350" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  return <path d="M44 61 q6 7 12 0 z" fill="#c95a7a" />;
}

export function Chibi({ m, mood = 'happy', size = 120 }: { m: ShipMember; mood?: Mood; size?: number }) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} aria-hidden="true" className="chibi-svg">
      {m.style === 'long' && <path d="M14 46 Q8 90 16 118 L34 112 L34 70 L66 70 L66 112 L84 118 Q92 90 86 46Z" fill={m.hair} />}
      <rect x="28" y="84" width="44" height="40" rx="16" fill={m.outfit} />
      <circle cx="26" cy="98" r="8" fill="#ffe3cf" />
      <circle cx="74" cy="98" r="8" fill="#ffe3cf" />
      <circle cx="50" cy="48" r="36" fill="#ffe8d6" />
      <Hair m={m} />
      <Eyes mood={mood} />
      <ellipse cx="28" cy="58" rx="6" ry={mood === 'blush' ? 5 : 3.5} fill="#f6a5bd" opacity={mood === 'blush' ? 0.95 : 0.6} />
      <ellipse cx="72" cy="58" rx="6" ry={mood === 'blush' ? 5 : 3.5} fill="#f6a5bd" opacity={mood === 'blush' ? 0.95 : 0.6} />
      <Mouth mood={mood} />
      {m.labret && <circle cx="50" cy="71" r="1.6" fill="#e4e6ec" stroke="#9a9caa" strokeWidth="0.5" />}
      {m.glasses && (
        <g stroke="#3f5270" strokeWidth="2" fill="#dbe7ff" fillOpacity="0.15">
          <rect x="25" y="41" width="22" height="16" rx="4" />
          <rect x="53" y="41" width="22" height="16" rx="4" />
          <path d="M47 47 Q50 45 53 47" fill="none" />
        </g>
      )}
      <text x="50" y="112" fontSize="16" textAnchor="middle">{m.emoji}</text>
    </svg>
  );
}

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
  const size = Math.min(110, Math.floor(400 / n));

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
            <Chibi m={m} size={38} />
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
              <Chibi m={m} mood={(i === 0 ? action?.moodA : action?.moodB) ?? 'happy'} size={size} />
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
