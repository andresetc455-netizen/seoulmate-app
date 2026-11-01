import { useMemo, useState } from 'react';
import { useDoc } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { toast } from '../components/ui';
import {
  SHIP_ACTIONS, SHIP_MEMBERS, FORBIDDEN_NICKNAME_MSG, NICKNAME_MAX, actionLine, compatibility, displayName,
  isForbiddenNickname, memberById, nicknamesOf, shipName, type Mood, type ShipAction, type ShipMember,
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
      <rect x="28" y="84" width="44" height="40" rx="16" fill={m.outfit} />
      <circle cx="26" cy="98" r="8" fill="#ffe3cf" />
      <circle cx="74" cy="98" r="8" fill="#ffe3cf" />
      <circle cx="50" cy="48" r="36" fill="#ffe8d6" />
      <Hair m={m} />
      <Eyes mood={mood} />
      <ellipse cx="28" cy="58" rx="6" ry={mood === 'blush' ? 5 : 3.5} fill="#f6a5bd" opacity={mood === 'blush' ? 0.95 : 0.6} />
      <ellipse cx="72" cy="58" rx="6" ry={mood === 'blush' ? 5 : 3.5} fill="#f6a5bd" opacity={mood === 'blush' ? 0.95 : 0.6} />
      <Mouth mood={mood} />
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
export function ShipsTab() {
  const data = useDoc(btsDoc);
  const nicks = data.nicknames;
  const [a, setA] = useState('jimin');
  const [b, setB] = useState('jk');
  const [action, setAction] = useState<ShipAction | null>(null);
  const [run, setRun] = useState(0);
  const [editing, setEditing] = useState(false);

  const ma = memberById(a)!;
  const mb = memberById(b)!;
  const na = displayName(a, nicks);
  const nb = displayName(b, nicks);
  const line = action ? actionLine(action, na, nb, run) : `Elegí qué hacen ${na} y ${nb} 💜`;
  const pct = compatibility(a, b);

  const fx = useMemo(
    () =>
      action
        ? Array.from({ length: 14 }, (_, i) => ({
            ch: FX_CHARS[action.fx][i % FX_CHARS[action.fx].length],
            left: (i * 37 + run * 13) % 92,
            delay: (i % 7) * 0.22,
            dur: 2.2 + (i % 4) * 0.4,
          }))
        : [],
    [action, run],
  );

  const pick = (side: 'a' | 'b', id: string) => {
    if (side === 'a') {
      if (id === b) setB(a);
      setA(id);
    } else {
      if (id === a) setA(b);
      setB(id);
    }
    setAction(null);
  };

  const doAction = (act: ShipAction) => {
    setAction(act);
    setRun((r) => r + 1);
  };

  const surprise = () => {
    const ids = SHIP_MEMBERS.map((m) => m.id);
    const x = ids[Math.floor(Math.random() * ids.length)];
    let y = x;
    while (y === x) y = ids[Math.floor(Math.random() * ids.length)];
    setA(x);
    setB(y);
    doAction(SHIP_ACTIONS[Math.floor(Math.random() * SHIP_ACTIONS.length)]);
  };

  return (
    <div className="ships">
      <div className="card rose ship-head">
        <h2 className="ship-title">{shipName(a, b)} 💞</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Compatibilidad: <strong>{pct}%</strong> {pct > 94 ? '· almas gemelas 💍' : '· química total ✨'}
        </p>
      </div>

      <div className="ship-pickers">
        <MemberPicker label="Primero" value={a} nicks={nicks} onPick={(id) => pick('a', id)} />
        <MemberPicker label="Segundo" value={b} nicks={nicks} onPick={(id) => pick('b', id)} />
      </div>

      <div
        key={run}
        className={`ship-stage scene-${action?.scene ?? 'stage'} ${action ? `move-${action.move} act-${action.id}` : ''}`}
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
        <div className="ship-pair">
          <div className="ship-chibi left">
            <Chibi m={ma} mood={action?.moodA ?? 'happy'} />
            <span className="ship-name">{na}</span>
          </div>
          <div className="ship-mid" aria-hidden="true">{action ? action.emoji : '💜'}</div>
          <div className="ship-chibi right">
            <Chibi m={mb} mood={action?.moodB ?? 'happy'} />
            <span className="ship-name">{nb}</span>
          </div>
        </div>
      </div>
      <p className="ship-line" aria-live="polite">{line}</p>

      <div className="ship-actions">
        {SHIP_ACTIONS.map((act) => (
          <button key={act.id} type="button" className={`ship-act ${action?.id === act.id ? 'on' : ''}`} onClick={() => doAction(act)}>
            <span className="ship-act-emoji">{act.emoji}</span>
            {act.label}
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

function MemberPicker({
  label, value, nicks, onPick,
}: { label: string; value: string; nicks: Record<string, string> | undefined; onPick: (id: string) => void }) {
  return (
    <div className="ship-picker" role="radiogroup" aria-label={label}>
      {SHIP_MEMBERS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          aria-label={displayName(m.id, nicks)}
          className={`ship-pick ${value === m.id ? 'on' : ''}`}
          onClick={() => onPick(m.id)}
        >
          <Chibi m={m} size={38} />
          <span>{m.name}</span>
        </button>
      ))}
    </div>
  );
}

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
