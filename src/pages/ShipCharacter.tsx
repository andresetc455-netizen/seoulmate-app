import type { Mood, ShipMember } from '../lib/ships';

// Personaje ilustrado estilo webtoon (dibujo vectorial, sin fotos), con la camiseta de Argentina.
const SKIN = '#f6dcc6';
const SKIN_SH = '#e8c2a6';
const CELESTE = '#75aadb';
const NAVY = '#1d2a5a';

function BackHair({ m }: { m: ShipMember }) {
  if (m.style === 'mullet') return <path d="M29 40 Q27 66 34 76 L44 70 L56 70 L66 76 Q73 66 71 40Z" fill={m.hair} />;
  if (m.style === 'wavy') return <path d="M29 42 Q27 62 33 68 L67 68 Q73 62 71 42Z" fill={m.hair} />;
  return <path d="M29 44 Q29 56 33 60 L67 60 Q71 56 71 44Z" fill={m.hair} />;
}

function FrontHair({ m }: { m: ShipMember }) {
  const c = m.hair;
  const cap = <path d="M29 46 Q26 13 50 11 Q74 13 71 46 Q70 30 64 26 Q50 21 36 26 Q30 30 29 46Z" fill={c} />;
  let fringe;
  switch (m.style) {
    case 'sweep':
      fringe = <path d="M31 36 Q34 15 56 15 Q71 18 70 36 Q64 24 52 25 Q50 18 44 26 Q36 28 31 36Z" fill={c} />;
      break;
    case 'soft':
      fringe = <path d="M30 42 Q31 20 50 20 Q69 20 70 42 Q66 32 58 33 L54 27 L50 34 L44 28 Q36 32 30 42Z" fill={c} />;
      break;
    case 'curtain':
      fringe = <path d="M30 47 Q30 22 50 21 Q70 22 70 47 Q67 34 56 30 Q52 28 50 31 Q48 28 44 30 Q33 34 30 47Z" fill={c} />;
      break;
    case 'curly':
      fringe = (
        <g fill={c}>
          {[[33, 30], [39, 23], [46, 19], [54, 19], [61, 23], [67, 30], [36, 36], [64, 36], [50, 25], [43, 29], [57, 29]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6} />
          ))}
        </g>
      );
      break;
    case 'fluffy':
      fringe = <path d="M30 44 L34 30 L38 38 L42 27 L46 38 L50 26 L54 38 L58 27 L62 38 L66 30 L70 44 Q71 20 50 18 Q29 20 30 44Z" fill={c} />;
      break;
    case 'wavy':
      fringe = <path d="M29 50 Q28 22 50 20 Q72 22 71 50 Q68 40 64 42 Q62 32 56 36 Q52 28 48 35 Q42 30 40 40 Q34 38 33 46Z" fill={c} />;
      break;
    default: // mullet
      fringe = <path d="M29 48 Q28 20 50 19 Q72 20 71 48 Q68 38 63 41 L60 32 L55 40 L50 30 L45 40 L40 32 L37 41 Q32 38 29 48Z" fill={c} />;
  }
  return (
    <g>
      {cap}
      {fringe}
      <path d="M38 22 Q48 16 60 21" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  const brows = (
    <g stroke="#3a2a22" strokeWidth="1.4" strokeLinecap="round" fill="none">
      <path d={mood === 'blush' ? 'M38 40 q4 -1.5 8 0.5' : 'M38 40 q4 -2.5 8 -0.5'} />
      <path d={mood === 'blush' ? 'M54 40.5 q4 -2 8 -0.5' : 'M54 39.5 q4 -2 8 0.5'} />
    </g>
  );
  if (mood === 'happy' || mood === 'kiss')
    return (
      <g>
        {brows}
        <g stroke="#2b1d18" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d={mood === 'kiss' ? 'M38 47 q4 2.5 8 0' : 'M38 48 q4 -4 8 0'} />
          <path d={mood === 'kiss' ? 'M54 47 q4 2.5 8 0' : 'M54 48 q4 -4 8 0'} />
          {mood === 'kiss' && <path d="M38 47 l-1.5 1.2 M62 47 l1.5 1.2" />}
        </g>
      </g>
    );
  const iris = (cx: number) =>
    mood === 'love' ? (
      <path d={`M${cx} 50.5 l-2.8 -3 q-1.2 -1.6 0.4 -2.6 q1.4 -0.8 2.4 0.8 q1 -1.6 2.4 -0.8 q1.6 1 0.4 2.6z`} fill="#e2577f" />
    ) : (
      <g>
        <ellipse cx={cx} cy={47.5} rx={2.6} ry={3.1} fill="#3b2a22" />
        <circle cx={cx + 0.9} cy={46.3} r={0.9} fill="#fff" />
      </g>
    );
  return (
    <g>
      {brows}
      <path d="M37.5 47.5 Q42 43.5 46.5 47.5 Q42 51 37.5 47.5Z" fill="#fff" />
      <path d="M53.5 47.5 Q58 43.5 62.5 47.5 Q58 51 53.5 47.5Z" fill="#fff" />
      {iris(42)}
      {iris(58)}
      <g stroke="#2b1d18" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M37 47.3 Q42 43 47 46.8" />
        <path d="M53 46.8 Q58 43 63 47.3" />
      </g>
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'kiss') return <ellipse cx="50.5" cy="61" rx="2" ry="1.6" fill="#d9657f" />;
  if (mood === 'blush') return <path d="M47 61 q3 1.5 6 0" stroke="#b5566c" strokeWidth="1.3" fill="none" strokeLinecap="round" />;
  return <path d="M45.5 59.5 q4.5 4.5 9 0 q-4.5 1.5 -9 0Z" fill="#c4566e" />;
}

export function ShipCharacter({ m, mood = 'happy', size = 110, bust = false }: { m: ShipMember; mood?: Mood; size?: number; bust?: boolean }) {
  const blush = mood === 'blush' || mood === 'love' || mood === 'kiss';
  const viewBox = bust ? '22 8 56 64' : '0 0 100 200';
  const h = bust ? (size * 64) / 56 : size * 2;
  return (
    <svg viewBox={viewBox} width={size} height={h} aria-hidden="true" className="chibi-svg">
      <defs>
        <pattern id="arg-stripes" width="11" height="10" patternUnits="userSpaceOnUse">
          <rect width="11" height="10" fill="#fff" />
          <rect x="0" width="5.5" height="10" fill={CELESTE} />
        </pattern>
      </defs>
      {!bust && (
        <g>
          {/* piernas, medias y botines */}
          <rect x="33" y="148" width="11" height="24" rx="4" fill={SKIN} />
          <rect x="56" y="148" width="11" height="24" rx="4" fill={SKIN} />
          <rect x="32.5" y="166" width="12" height="20" rx="3" fill="#fff" />
          <rect x="55.5" y="166" width="12" height="20" rx="3" fill="#fff" />
          <rect x="32.5" y="168" width="12" height="2.5" fill={CELESTE} />
          <rect x="55.5" y="168" width="12" height="2.5" fill={CELESTE} />
          <path d="M30 186 Q30 182 35 182 L45 182 Q47 186 46 191 L30 191Z" fill="#222" />
          <path d="M54 182 L65 182 Q70 182 70 186 L70 191 L54 191 Q53 186 54 182Z" fill="#222" />
          {/* short negro */}
          <path d="M27 128 L73 128 L75 152 L52 152 L50 144 L48 152 L25 152Z" fill="#141414" />
          <rect x="27" y="128" width="46" height="3" fill="#2a2a2a" />
          {/* brazos */}
          <path d="M22 100 Q16 118 17 136" stroke={SKIN} strokeWidth="7.5" strokeLinecap="round" fill="none" />
          <path d="M78 100 Q84 118 83 136" stroke={SKIN} strokeWidth="7.5" strokeLinecap="round" fill="none" />
          <circle cx="17" cy="139" r="4.6" fill={SKIN} />
          <circle cx="83" cy="139" r="4.6" fill={SKIN} />
        </g>
      )}
      <BackHair m={m} />
      {/* cuello */}
      <rect x="44" y="64" width="12" height="18" rx="4" fill={SKIN} />
      <path d="M44 70 Q50 75 56 70 L56 74 Q50 78 44 74Z" fill={SKIN_SH} />
      {/* camiseta albiceleste */}
      <path d="M22 92 Q24 80 42 78 L58 78 Q76 80 78 92 L80 108 L72 110 L74 131 L26 131 L28 110 L20 108Z" fill="url(#arg-stripes)" stroke="#d7e3ef" strokeWidth="0.6" />
      <path d="M41.5 78 L50 88 L58.5 78 L55.5 78 L50 84 L44.5 78Z" fill={NAVY} />
      <path d="M20 108 L28 110 M80 108 L72 110" stroke={NAVY} strokeWidth="1.6" />
      {!bust && (
        <text x="61" y="104" fontSize="9" fontWeight="800" fill={NAVY} textAnchor="middle" fontFamily="system-ui, sans-serif">
          {m.number}
        </text>
      )}
      {/* cara */}
      <ellipse cx="31" cy="48" rx="3" ry="5" fill={SKIN} />
      <ellipse cx="69" cy="48" rx="3" ry="5" fill={SKIN} />
      {m.extra === 'earring' && <circle cx="31" cy="54" r="1.3" fill="#c9cbd3" />}
      <path d="M31 40 Q31 18 50 17 Q69 18 69 40 Q69 59 58 68 Q50 73 42 68 Q31 59 31 40Z" fill={SKIN} />
      <FrontHair m={m} />
      <Eyes mood={mood} />
      <path d="M50 50 q-1.4 4.5 0.6 5.6" stroke={SKIN_SH} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="38.5" cy="55" rx="4" ry={blush ? 2.4 : 1.6} fill="#f2a0b6" opacity={blush ? 0.85 : 0.45} />
      <ellipse cx="61.5" cy="55" rx="4" ry={blush ? 2.4 : 1.6} fill="#f2a0b6" opacity={blush ? 0.85 : 0.45} />
      <Mouth mood={mood} />
      {m.extra === 'dimples' && (
        <g fill={SKIN_SH}>
          <circle cx="43" cy="61" r="0.9" />
          <circle cx="57" cy="61" r="0.9" />
        </g>
      )}
      {m.extra === 'mole' && <circle cx="50.8" cy="55.2" r="0.6" fill="#6b4a3a" />}
      {m.extra === 'earring' && <circle cx="53.5" cy="62.5" r="0.7" fill="#9a9aa8" />}
    </svg>
  );
}
