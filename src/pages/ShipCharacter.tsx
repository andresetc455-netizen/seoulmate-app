import { useId } from 'react';
import type { Mood, ShipMember } from '../lib/ships';

// Personaje ilustrado semi-realista estilo webtoon (dibujo vectorial, sin fotos),
// con la camiseta de Argentina sin escudo ni marcas.
const SKIN_L = '#fbe7d8';
const SKIN = '#f3d3bb';
const SKIN_SH = '#dfae92';
const CELESTE = '#74acdf';
const NAVY = '#1b2754';

/** Aclara (amt > 0) u oscurece (amt < 0) un color hex. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Puntas de los mechones del flequillo para cada peinado (coordenadas de la cabeza).
const TIPS: Record<ShipMember['style'], Array<[number, number]>> = {
  sweep: [[33, 35], [38, 29], [44, 26], [52, 23], [60, 22], [67, 28]],
  soft: [[31, 41], [37, 34], [43, 30], [49, 33], [54, 28], [60, 33], [68, 40]],
  curtain: [[31, 46], [36, 37], [42, 32], [48, 30], [52, 30], [58, 32], [64, 37], [69, 46]],
  curly: [[30, 36], [35, 29], [41, 26], [47, 30], [53, 30], [59, 26], [65, 29], [70, 36]],
  fluffy: [[34, 31], [38, 38], [42, 28], [46, 38], [50, 27], [54, 38], [58, 28], [62, 38], [66, 31]],
  wavy: [[32, 47], [37, 41], [41, 36], [45, 33], [49, 34], [53, 29], [57, 35], [62, 33], [65, 42], [69, 48]],
  long: [[31, 46], [37, 36], [43, 40], [46, 32], [49, 38], [51, 38], [54, 32], [57, 40], [63, 36], [69, 46]],
  mullet: [[30, 48], [36, 41], [40, 33], [45, 40], [50, 31], [55, 40], [60, 33], [64, 41], [70, 48]],
};

function BackHair({ m, fill }: { m: ShipMember; fill: string }) {
  if (m.style === 'mullet') return <path d="M29 40 Q28.5 52 31 56 L69 56 Q71.5 52 71 40Z" fill={fill} />;
  if (m.style === 'long') return <path d="M29 42 Q28 56 31 62 L69 62 Q72 56 71 42Z" fill={fill} />;
  if (m.style === 'wavy') return <path d="M29 42 Q26 62 32 70 Q36 66 40 69 L60 69 Q64 66 68 70 Q74 62 71 42Z" fill={fill} />;
  return <path d="M29 44 Q29 56 33 61 L67 61 Q71 56 71 44Z" fill={fill} />;
}

function Fringe({ m, fill }: { m: ShipMember; fill: string }) {
  switch (m.style) {
    case 'sweep':
      return <path d="M30 38 Q32 14 56 14 Q72 17 71 38 Q66 25 53 26 Q51 19 45 26 Q36 29 30 38Z" fill={fill} />;
    case 'soft':
      return <path d="M30 43 Q30 19 50 19 Q70 19 70 43 Q66 32 59 33 L54 27 L50 34 L44 28 Q36 32 30 43Z" fill={fill} />;
    case 'curtain':
      return <path d="M30 48 Q29 21 50 20 Q71 21 70 48 Q67 34 57 30 Q52 28 50 31 Q48 28 43 30 Q33 34 30 48Z" fill={fill} />;
    case 'curly':
      return (
        <g fill={fill}>
          {[[31, 32], [36, 25], [42, 20], [50, 18], [58, 20], [64, 25], [69, 32], [34, 38], [66, 38], [46, 25], [54, 25], [40, 30], [60, 30]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6.2} />
          ))}
        </g>
      );
    case 'fluffy':
      return <path d="M29 45 L34 30 L38 39 L42 27 L46 39 L50 25 L54 39 L58 27 L62 39 L66 30 L71 45 Q72 18 50 17 Q28 18 29 45Z" fill={fill} />;
    case 'long':
      return <path d="M29 47 Q28 19 50 18 Q72 19 71 47 Q68 34 60 31 L57 41 L54 31 L51 39 L50 33 L49 39 L46 31 L43 41 L40 31 Q32 34 29 47Z" fill={fill} />;
    case 'wavy':
      return <path d="M28 51 Q27 21 50 19 Q73 21 72 51 Q69 40 65 43 Q63 32 57 36 Q53 27 49 35 Q43 30 40 41 Q35 38 33 47Z" fill={fill} />;
    default:
      return <path d="M29 44 Q27 19 50 18 Q73 19 71 44 Q68 37 64 40 L60 32 L55 41 L50 30 L45 41 L40 32 L36 40 Q32 37 29 44Z" fill={fill} />;
  }
}

function Eyes({ mood, id, iris, fem }: { mood: Mood; id: string; iris: string; fem?: boolean }) {
  if (mood === 'happy' || mood === 'kiss') {
    const closed = mood === 'kiss';
    return (
      <g stroke="#2a1b16" fill="none" strokeLinecap="round">
        <path d={closed ? 'M37.5 45.5 Q42 48.3 46.8 45.3' : 'M37.5 46.4 Q42 42.2 46.8 45.6'} strokeWidth="1.3" />
        <path d={closed ? 'M62.5 45.5 Q58 48.3 53.2 45.3' : 'M62.5 46.4 Q58 42.2 53.2 45.6'} strokeWidth="1.3" />
                <path d="M38.5 42.2 Q42 40.4 46 42.2 M61.5 42.2 Q58 40.4 54 42.2" strokeWidth="0.45" strokeOpacity="0.45" />
      </g>
    );
  }
  const eye = (side: 1 | -1) => {
    const cx = side === 1 ? 42.2 : 57.8;
    const shape =
      side === 1 ? 'M37.2 45.2 Q41 42.4 47.2 44.2 Q43 47.2 37.2 45.2Z' : 'M62.8 45.2 Q59 42.4 52.8 44.2 Q57 47.2 62.8 45.2Z';
    const clip = `${id}-eye${side}`;
    return (
      <g>
        <clipPath id={clip}>
          <path d={shape} />
        </clipPath>
        <path d={shape} fill="#fdfbfa" />
        <g clipPath={`url(#${clip})`}>
          <path d={side === 1 ? 'M37 44 Q42 42 47.2 43.6 L47.2 44.8 Q42 43.4 37 45.4Z' : 'M63 44 Q58 42 52.8 43.6 L52.8 44.8 Q58 43.4 63 45.4Z'} fill="#d9c4c0" opacity="0.6" />
          {mood === 'love' ? (
            <path d={`M${cx} 47.6 l-2.6 -2.7 q-1.1 -1.5 0.4 -2.4 q1.3 -0.7 2.2 0.7 q0.9 -1.4 2.2 -0.7 q1.5 0.9 0.4 2.4z`} fill="#e0476f" />
          ) : (
            <>
              <circle cx={cx} cy={44.8} r={2.35} fill={`url(#${id}-iris)`} />
              <circle cx={cx} cy={44.8} r={2.35} fill="none" stroke="#1d120e" strokeWidth="0.3" />
              <circle cx={cx} cy={44.9} r={1} fill="#120a08" />
            </>
          )}
          <circle cx={cx + 0.8} cy={44} r={0.6} fill="#fff" />
          <circle cx={cx - 0.9} cy={46.1} r={0.38} fill="#fff" opacity="0.85" />
        </g>
        {/* párpado y pestañas */}
        <path
          d={side === 1 ? 'M36.8 45.4 Q40.8 41.9 47.4 44.1' : 'M63.2 45.4 Q59.2 41.9 52.6 44.1'}
          stroke="#1e1310"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
                {fem && <path d={side === 1 ? 'M36.8 45.3 l-1.6 -0.4 M37.5 44.2 l-1.4 -0.9 M38.6 43.3 l-1 -1.1' : 'M63.2 45.3 l1.6 -0.4 M62.5 44.2 l1.4 -0.9 M61.4 43.3 l1 -1.1'} stroke="#1e1310" strokeWidth="0.55" strokeLinecap="round" />}
        <path d={side === 1 ? 'M38.6 42.3 Q42 40.8 46.4 42.4' : 'M61.4 42.3 Q58 40.8 53.6 42.4'} stroke="#7a5446" strokeWidth="0.45" fill="none" strokeOpacity="0.6" />
        <path d={side === 1 ? 'M38.2 47 Q42 48.8 46.2 46.4' : 'M61.8 47 Q58 48.8 53.8 46.4'} stroke="#7a5446" strokeWidth="0.35" fill="none" strokeOpacity="0.45" />
      </g>
    );
  };
  return (
    <g className="eyes-open">
      <radialGradient id={`${id}-iris`} cx="0.5" cy="0.65" r="0.6">
        <stop offset="0" stopColor={shade(iris, 0.45)} />
        <stop offset="0.55" stopColor={iris} />
        <stop offset="1" stopColor={shade(iris, -0.55)} />
      </radialGradient>
      {eye(1)}
      {eye(-1)}
    </g>
  );
}

function Mouth({ mood, id }: { mood: Mood; id: string }) {
  if (mood === 'kiss')
    return (
      <g>
        <ellipse cx="50.4" cy="61.4" rx="2.3" ry="1.9" fill={`url(#${id}-lip)`} />
        <path d="M48.6 61.3 Q50.4 60.6 52.2 61.3" stroke="#8a5550" strokeWidth="0.5" fill="none" />
        <ellipse cx="51" cy="62.2" rx="0.7" ry="0.35" fill="#fff" opacity="0.5" />
      </g>
    );
  if (mood === 'blush')
    return (
      <g>
        <path d="M46.2 61 Q48 60.5 50 60.8 Q52 60.5 53.8 61 Q50 62 46.2 61Z" fill="#c4958a" />
        <path d="M47 61.5 Q50 64.2 53 61.5 Q50 62.6 47 61.5Z" fill={`url(#${id}-lip)`} />
        <path d="M46.2 61 Q50 62 53.8 61" stroke="#8a5550" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </g>
    );
  if (mood === 'smile')
    return (
      <g>
        <path d="M45.4 60.4 Q50 63.6 54.6 60.4" stroke="#7a4a44" strokeWidth="0.85" fill="none" strokeLinecap="round" />
        <path d="M47.4 62.9 Q50 64.2 52.6 62.9" stroke="#c4958a" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M44.8 60.1 Q45.3 59.7 45.8 60.4 M55.2 60.1 Q54.7 59.7 54.2 60.4" stroke="#8a5550" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      </g>
    );
  return (
    <g>
      <path d="M45.3 60.2 Q50 61.4 54.7 60.2 Q52.6 65.6 50 65.6 Q47.4 65.6 45.3 60.2Z" fill="#6e3434" />
      <path d="M46.2 60.6 Q50 61.6 53.8 60.6 L53.4 61.6 Q50 62.4 46.6 61.6Z" fill="#fbf7f4" />
      <path d="M47.6 64.2 Q50 65.6 52.4 64.2 Q50 65.9 47.6 64.2Z" fill="#b97a72" />
      <path d="M44.6 60.1 Q45.2 59.6 45.8 60.3 M55.4 60.1 Q54.8 59.6 54.2 60.3" stroke="#8a5550" strokeWidth="0.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function ShipCharacter({ m, mood = 'smile', size = 110, bust = false }: { m: ShipMember; mood?: Mood; size?: number; bust?: boolean }) {
  const id = useId().replace(/:/g, '');
  const blush = mood === 'blush' || mood === 'love' || mood === 'kiss';
  const viewBox = bust ? '28 7 44 52' : '0 0 100 260';
  const h = bust ? (size * 52) / 44 : size * 2.6;
  const hairDark = shade(m.hair, -0.45);
  const tips = TIPS[m.style];
  const u = (s: string) => `url(#${id}-${s})`;

  return (
    <svg viewBox={viewBox} width={size} height={h} aria-hidden="true" className="chibi-svg">
      <defs>
        <pattern id={`${id}-stripes`} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#fbfdff" />
          <rect x="0" width="5" height="10" fill={CELESTE} />
        </pattern>
        <radialGradient id={`${id}-skin`} cx="0.45" cy="0.38" r="0.7">
          <stop offset="0" stopColor={SKIN_L} />
          <stop offset="0.65" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_SH} />
        </radialGradient>
        <linearGradient id={`${id}-limb`} x1="0" x2="1">
          <stop offset="0" stopColor={SKIN_SH} />
          <stop offset="0.45" stopColor={SKIN_L} />
          <stop offset="1" stopColor={SKIN_SH} />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={shade(m.hair, 0.28)} />
          <stop offset="0.5" stopColor={m.hair} />
          <stop offset="1" stopColor={shade(m.hair, -0.35)} />
        </linearGradient>
        <linearGradient id={`${id}-round`} x1="0" x2="1">
          <stop offset="0" stopColor="#0b1430" stopOpacity="0.32" />
          <stop offset="0.28" stopColor="#0b1430" stopOpacity="0" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.78" stopColor="#0b1430" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1430" stopOpacity="0.36" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x1="0" x2="1">
          <stop offset="0" stopColor="#050505" />
          <stop offset="0.5" stopColor="#2b2b2e" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={`${id}-sock`} x1="0" x2="1">
          <stop offset="0" stopColor="#d5dbe4" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9d0db" />
        </linearGradient>
        <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d49a90" />
          <stop offset="1" stopColor="#b8786e" />
        </linearGradient>
        <clipPath id={`${id}-shirt`}>
          <path d="M21 86 Q23 73 42 71 L58 71 Q77 73 79 86 L82 102 L72.5 105 Q70 121 71.5 140 Q50 144 28.5 140 Q30 121 27.5 105 L18 102Z" />
        </clipPath>
      </defs>

      {!bust && (
        <g>
          <ellipse cx="50" cy="254" rx="24" ry="3.2" fill="#3d3350" opacity="0.16" />
          {/* piernas */}
          <path d="M31 164 L45.6 164 Q45.2 180 43.6 192 Q44.8 200 43.8 208 L34.4 208 Q32.8 199 33.8 191 Q31.4 178 31 164Z" fill={u('limb')} />
          <path d="M54.4 164 L69 164 Q68.6 178 66.2 191 Q67.2 199 65.6 208 L56.2 208 Q55.2 200 56.4 192 Q54.8 180 54.4 164Z" fill={u('limb')} />
          <path d="M36 186 Q39 188 42 186 M58 186 Q61 188 64 186" stroke={SKIN_SH} strokeWidth="0.6" fill="none" opacity="0.7" />
          {/* medias */}
          <path d="M34 204 L44 204 L43.6 244 L34.4 244Z" fill={u('sock')} />
          <path d="M56 204 L66 204 L65.6 244 L56.4 244Z" fill={u('sock')} />
          <rect x="34" y="207" width="10" height="2.2" fill={CELESTE} />
          <rect x="34" y="211" width="10" height="2.2" fill={CELESTE} />
          <rect x="56" y="207" width="10" height="2.2" fill={CELESTE} />
          <rect x="56" y="211" width="10" height="2.2" fill={CELESTE} />
          {/* botines */}
          <path d="M33.6 242 L44.2 242 Q45.6 246 45 251 L29.5 251 Q28.6 246 33.6 242Z" fill={u('dark')} />
          <path d="M55.8 242 L66.4 242 Q71.4 246 70.5 251 L55 251 Q54.4 246 55.8 242Z" fill={u('dark')} />
          <path d="M29.5 251 L45 251 M55 251 L70.5 251" stroke="#e9ecf1" strokeWidth="1.2" />
          <path d="M32 245.5 Q35 244.2 38 245 M58 245 Q61 244.2 64 245.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.7" fill="none" />
          {/* short */}
          <path d="M28.5 136 L71.5 136 L73.5 168 L52 168 L50 158 L48 168 L26.5 168Z" fill={u('dark')} />
          <path d="M28.5 136 L71.5 136 L71.7 139.5 L28.3 139.5Z" fill="#2c2c30" />
          <path d="M27.2 146 L26.8 167 M72.8 146 L73.2 167" stroke="#f2f2f2" strokeWidth="1" />
          <path d="M38 145 Q40 156 37 167 M62 145 Q60 156 63 167 M50 141 L50 157" stroke="#fff" strokeOpacity="0.09" strokeWidth="1.2" fill="none" />
          {/* brazos */}
          <path d="M19.5 99 Q15 112 16.5 124 Q17.2 136 19.8 146 L26.6 146 Q25.6 134 26.4 124 Q28 112 30.5 102Z" fill={u('limb')} />
          <path d="M80.5 99 Q85 112 83.5 124 Q82.8 136 80.2 146 L73.4 146 Q74.4 134 73.6 124 Q72 112 69.5 102Z" fill={u('limb')} />
          {m.tattoo && (
            <g stroke="#3a3a44" strokeWidth="0.5" fill="none" opacity="0.65" strokeLinecap="round">
              <path d="M20 128 Q22 131 21 135 Q23 138 21.5 142" />
              <path d="M22.5 127 Q25 130 23.5 134 M24.5 136 Q22.5 139 24.8 142 M19.5 133 l2 1 M20 138 l2.4 0.6" />
              <circle cx="23.4" cy="131.5" r="1.1" />
            </g>
          )}
          <path d="M18.6 124 Q21.5 125.8 25.6 124 M81.4 124 Q78.5 125.8 74.4 124" stroke={SKIN_SH} strokeWidth="0.6" fill="none" />
          <path d="M19.4 144.5 Q17.6 152 20.6 156.4 Q24.4 158.6 27 154.4 Q28.4 149 27.2 144.5Z" fill={u('limb')} />
          <path d="M80.6 144.5 Q82.4 152 79.4 156.4 Q75.6 158.6 73 154.4 Q71.6 149 72.8 144.5Z" fill={u('limb')} />
          <path d="M26.4 148 Q27.8 151 26.2 154 M73.6 148 Q72.2 151 73.8 154 M21 152 Q22.5 153.5 24.5 152.6 M79 152 Q77.5 153.5 75.5 152.6" stroke={SKIN_SH} strokeWidth="0.55" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* pelo de atrás */}
      <g transform="translate(5 1) scale(0.9)">
        <BackHair m={m} fill={shade(m.hair, -0.3)} />
      </g>

      {m.style === 'long' && (
        <g>
          <path d="M31 30 Q23 60 25 92 Q26 112 31 120 L42 114 L44 70 L56 70 L58 114 L69 120 Q74 112 75 92 Q77 60 69 30Z" fill={shade(m.hair, -0.25)} />
          {m.highlights && <path d="M28 70 Q27 95 31 116 M72 70 Q73 95 69 116" stroke={m.highlights} strokeWidth="1.4" fill="none" opacity="0.7" />}
        </g>
      )}
      {/* cuello */}
      <path d="M42.8 56 L57.2 56 L58.6 74 Q50 78.5 41.4 74Z" fill={u('limb')} />
      <path d="M43 61 Q50 67 57 61 L57.4 66 Q50 70 42.6 66Z" fill={SKIN_SH} opacity="0.7" />
      <path d="M49.4 68 Q50 69.4 50.6 68" stroke={SKIN_SH} strokeWidth="0.7" fill="none" />

      {/* camiseta albiceleste */}
      <g clipPath={u('shirt')}>
        <rect x="18" y="66" width="64" height="80" fill={u('stripes')} />
        <rect x="18" y="66" width="64" height="80" fill={u('round')} />
        <ellipse cx="44" cy="80" rx="18" ry="9" fill="#fff" opacity="0.12" />
        <path d="M37 105 Q41 120 38 138 M63 106 Q59 121 62 138 M43 128 Q50 132 57 128 M30 94 Q34 98 32 104 M70 94 Q66 98 68 104" stroke="#1b2754" strokeOpacity="0.16" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M18 102 L27.5 105 L28 101 L18.8 98.4Z M82 102 L72.5 105 L72 101 L81.2 98.4Z" fill={NAVY} />
      </g>
      <path d="M21 86 Q23 73 42 71 L58 71 Q77 73 79 86 L82 102 L72.5 105 Q70 121 71.5 140 Q50 144 28.5 140 Q30 121 27.5 105 L18 102Z" fill="none" stroke="#9fb5cc" strokeWidth="0.5" />
      <path d="M42 71 L50 82 L58 71 L55.2 71 L50 78.4 L44.8 71Z" fill={NAVY} />
      <path d="M44.8 71 L50 78.4 L55.2 71Z" fill={u('limb')} />
      {m.chain && (
        <g stroke="#c9ccd6" fill="none" strokeWidth="0.7">
          <path d="M43.6 72 Q50 83 56.4 72" />
          <path d="M42.6 72 Q50 87 57.4 72" strokeWidth="0.5" />
          <path d="M50 84.6 L50 89 M48.4 86.2 L51.6 86.2" stroke="#e4e6ec" strokeWidth="0.9" />
        </g>
      )}
      {m.style === 'long' && (
        <g fill={u('hair')}>
          <path d="M33 52 Q29 82 32 114 L39 110 Q36 84 39 62Z" />
          <path d="M67 52 Q71 82 68 114 L61 110 Q64 84 61 62Z" />
          {m.highlights && <path d="M34 62 Q32 86 34 108 M66 62 Q68 86 66 108" stroke={m.highlights} strokeWidth="1" fill="none" opacity="0.8" />}
        </g>
      )}
      {!bust && (
        <text x="61" y="95" fontSize="7" fontWeight="800" fill={NAVY} textAnchor="middle" fontFamily="system-ui, sans-serif" opacity="0.9">
          {m.number}
        </text>
      )}

      {/* cabeza */}
      <g transform="translate(5 1) scale(0.9)">
        <ellipse cx="31" cy="47" rx="3.2" ry="5.4" fill={u('limb')} />
        <ellipse cx="69" cy="47" rx="3.2" ry="5.4" fill={u('limb')} />
        <path d="M30.6 44.5 Q31.8 47 30.8 50 M69.4 44.5 Q68.2 47 69.2 50" stroke={SKIN_SH} strokeWidth="0.7" fill="none" />
        {m.extra === 'earring' && (
          <g>
            <circle cx="31" cy="53.4" r="1.2" fill="none" stroke="#d6d8df" strokeWidth="0.7" />
            <circle cx="69" cy="53.4" r="1.2" fill="none" stroke="#d6d8df" strokeWidth="0.7" />
          </g>
        )}
        <path d={m.fem ? 'M31 38 Q31 17 50 16 Q69 17 69 38 Q69 52 64 60 Q57 69.5 50 70.5 Q43 69.5 36 60 Q31 52 31 38Z' : 'M31 37 Q31 17 50 16 Q69 17 69 37 Q69.6 50 67.4 57.5 Q63.5 66.5 55.5 70.2 Q50 71.8 44.5 70.2 Q36.5 66.5 32.6 57.5 Q30.4 50 31 37Z'} fill={u('skin')} />
        {/* sombras de la cara */}
        <path d="M31.5 44 Q32.5 58 44 69 Q37 66 33.6 58.5 Q31.2 52 31.5 44Z" fill={SKIN_SH} opacity="0.45" />
        <path d="M68.5 44 Q67.5 58 56 69 Q63 66 66.4 58.5 Q68.8 52 68.5 44Z" fill={SKIN_SH} opacity="0.45" />
        <path d="M31 36 Q50 27 69 36 L69 41 Q50 32 31 41Z" fill={SKIN_SH} opacity="0.35" />
        <ellipse cx="38.5" cy="53.5" rx="4.4" ry={blush ? 2.4 : 1.8} fill="#ec9c9c" opacity={blush ? 0.45 : m.fem ? 0.3 : 0.12} />
        <ellipse cx="61.5" cy="53.5" rx="4.4" ry={blush ? 2.4 : 1.8} fill="#ec9c9c" opacity={blush ? 0.45 : m.fem ? 0.3 : 0.12} />
        {blush && <path d="M36 52.5 l1.2 -1.4 M38.5 52.6 l1.2 -1.4 M61 52.6 l1.2 -1.4 M63.5 52.5 l1.2 -1.4" stroke="#e0607f" strokeWidth="0.4" opacity="0.7" />}

        {/* cejas */}
        <path d={m.fem ? 'M36.8 39.6 Q41 36.8 47.2 37.9 L47.1 38.9 Q41.5 38 37.2 40.4Z' : 'M36 39.8 Q41 36.6 47.6 37.4 L47.5 39.8 Q41.5 38.9 36.6 41.3Z'} fill={hairDark} />
        <path d={m.fem ? 'M63.2 39.6 Q59 36.8 52.8 37.9 L52.9 38.9 Q58.5 38 62.8 40.4Z' : 'M64 39.8 Q59 36.6 52.4 37.4 L52.5 39.8 Q58.5 38.9 63.4 41.3Z'} fill={hairDark} />
        <Eyes mood={mood} id={id} iris={m.iris} fem={m.fem} />

        {/* nariz */}
        <path d="M49 45 Q47.8 51.5 47.9 54.4" stroke={SKIN_SH} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M47 55.3 Q48.4 56.8 50 56.3 Q51.6 56.8 53 55.3" stroke="#c98d76" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        <ellipse cx="50.7" cy="52.2" rx="0.55" ry="1.7" fill="#fff" opacity="0.5" />
        <Mouth mood={mood} id={id} />
        {m.fem && mood !== 'kiss' && <path d="M46.6 62.6 Q50 64.6 53.4 62.6 Q50 63.8 46.6 62.6Z" fill="#d9848f" opacity="0.8" />}
        {m.labret && <circle cx="50" cy="66" r="0.75" fill="#e4e6ec" stroke="#9a9caa" strokeWidth="0.25" />}
        {m.stubble && (
          <g fill="#5a463e">
            <path d="M40 62 Q42 69 50 71 Q58 69 60 62 Q57 67 50 67.6 Q43 67 40 62Z" opacity="0.16" />
            <path d="M45.5 58.6 Q50 57.6 54.5 58.6 L54 59.4 Q50 58.6 46 59.4Z" opacity="0.22" />
          </g>
        )}
        <path d="M47 68.4 Q50 69.6 53 68.4" stroke={SKIN_SH} strokeWidth="0.6" fill="none" opacity="0.6" />
        {m.extra === 'dimples' && mood !== 'kiss' && (
          <path d="M43.6 61.5 q-0.6 1.2 0.2 2 M56.4 61.5 q0.6 1.2 -0.2 2" stroke="#c58f7b" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        )}
        {m.extra === 'mole' && <circle cx="51.2" cy="55.1" r="0.5" fill="#6b4a3a" />}
        {m.extra === 'earring' && <circle cx="53.4" cy="63.6" r="0.6" fill="none" stroke="#b8bac4" strokeWidth="0.5" />}

        {/* pelo de adelante con mechones y brillo */}
        <path d="M29 46 Q26 12 50 10 Q74 12 71 46 Q70 30 64 26 Q50 21 36 26 Q30 30 29 46Z" fill={u('hair')} />
        <Fringe m={m} fill={u('hair')} />
        <g stroke={hairDark} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.55">
          {tips.map(([x, y], i) => (
            <path key={i} d={`M${50 + (x - 50) * 0.25} 12 Q${x + (x - 50) * 0.25} ${(y + 12) / 2} ${x} ${y}`} />
          ))}
        </g>
        <g stroke={shade(m.hair, 0.55)} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.5">
          {tips.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
            <path key={i} d={`M${50 + (x - 50) * 0.35} 15 Q${x + (x - 50) * 0.15} ${(y + 15) / 2} ${x + 1} ${y - 4}`} />
          ))}
        </g>
        {m.highlights && (
          <g stroke={m.highlights} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85">
            <path d="M40 21 Q41 30 43 40" />
            <path d="M58 21 Q57 30 57 40" />
            <path d="M47 19 Q47 26 46 32" />
          </g>
        )}
        {m.glasses && (
          <g stroke="#3f5270" strokeWidth="0.9" fill="#dbe7ff" fillOpacity="0.12">
            <rect x="35.2" y="40.6" width="13" height="8.6" rx="2" />
            <rect x="51.8" y="40.6" width="13" height="8.6" rx="2" />
            <path d="M48.2 43.4 Q50 42.4 51.8 43.4 M35.2 43 L31.5 42 M64.8 43 L68.5 42" fill="none" />
            <path d="M37 42 L39.5 41.6 M53.6 42 L56.1 41.6" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.5" />
          </g>
        )}
        <path d="M35 24 Q50 15.5 65 24" stroke={shade(m.hair, 0.6)} strokeWidth="2.2" strokeDasharray="3.2 1.6" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}
