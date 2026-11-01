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
  mullet: [[30, 48], [36, 41], [40, 33], [45, 40], [50, 31], [55, 40], [60, 33], [64, 41], [70, 48]],
};

function BackHair({ m, fill }: { m: ShipMember; fill: string }) {
  if (m.style === 'mullet') return <path d="M29 40 Q28 57 31.5 63 Q36 61 40 64 L60 64 Q64 61 68.5 63 Q72 57 71 40Z" fill={fill} />;
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
    case 'wavy':
      return <path d="M28 51 Q27 21 50 19 Q73 21 72 51 Q69 40 65 43 Q63 32 57 36 Q53 27 49 35 Q43 30 40 41 Q35 38 33 47Z" fill={fill} />;
    default:
      return <path d="M28 49 Q27 19 50 18 Q73 19 72 49 Q68 38 64 42 L60 32 L55 41 L50 30 L45 41 L40 32 L36 42 Q32 38 28 49Z" fill={fill} />;
  }
}

function Eyes({ mood, id, iris }: { mood: Mood; id: string; iris: string }) {
  if (mood === 'happy' || mood === 'kiss') {
    const closed = mood === 'kiss';
    return (
      <g stroke="#2a1b16" fill="none" strokeLinecap="round">
        <path d={closed ? 'M37.5 45.5 Q42 48.3 46.8 45.3' : 'M37.5 46.4 Q42 42.2 46.8 45.6'} strokeWidth="1.3" />
        <path d={closed ? 'M62.5 45.5 Q58 48.3 53.2 45.3' : 'M62.5 46.4 Q58 42.2 53.2 45.6'} strokeWidth="1.3" />
        {closed && <path d="M38 46.4 l-0.9 1.1 M40.3 47.3 l-0.5 1.2 M62 46.4 l0.9 1.1 M59.7 47.3 l0.5 1.2" strokeWidth="0.5" />}
        <path d="M38.5 42.2 Q42 40.4 46 42.2 M61.5 42.2 Q58 40.4 54 42.2" strokeWidth="0.45" strokeOpacity="0.45" />
      </g>
    );
  }
  const eye = (side: 1 | -1) => {
    const cx = side === 1 ? 42.2 : 57.8;
    const shape =
      side === 1 ? 'M37 45.6 Q40.6 41.3 47.2 44.4 Q43.2 48.6 37 45.6Z' : 'M63 45.6 Q59.4 41.3 52.8 44.4 Q56.8 48.6 63 45.6Z';
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
              <circle cx={cx} cy={45} r={2.75} fill={`url(#${id}-iris)`} />
              <circle cx={cx} cy={45} r={2.75} fill="none" stroke="#1d120e" strokeWidth="0.35" />
              <circle cx={cx} cy={45.1} r={1.15} fill="#120a08" />
            </>
          )}
          <circle cx={cx + 0.9} cy={44} r={0.85} fill="#fff" />
          <circle cx={cx - 0.9} cy={46.1} r={0.38} fill="#fff" opacity="0.85" />
        </g>
        {/* párpado y pestañas */}
        <path
          d={side === 1 ? 'M36.4 45.9 Q40.4 40.8 47.4 44.3' : 'M63.6 45.9 Q59.6 40.8 52.6 44.3'}
          stroke="#1e1310"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
        />
        <path d={side === 1 ? 'M36.6 45.8 l-1.5 -0.3 M37.3 44.6 l-1.3 -0.8' : 'M63.4 45.8 l1.5 -0.3 M62.7 44.6 l1.3 -0.8'} stroke="#1e1310" strokeWidth="0.55" strokeLinecap="round" />
        <path d={side === 1 ? 'M38.3 42.4 Q42 40.2 46.4 42.3' : 'M61.7 42.4 Q58 40.2 53.6 42.3'} stroke="#7a5446" strokeWidth="0.45" fill="none" strokeOpacity="0.6" />
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
        <path d="M48.6 61.3 Q50.4 60.6 52.2 61.3" stroke="#a9505f" strokeWidth="0.5" fill="none" />
        <ellipse cx="51" cy="62.2" rx="0.7" ry="0.35" fill="#fff" opacity="0.5" />
      </g>
    );
  if (mood === 'blush')
    return (
      <g>
        <path d="M46.2 61 Q48 60.3 50 60.8 Q52 60.3 53.8 61 Q50 62.2 46.2 61Z" fill="#d88c8f" />
        <path d="M47 61.5 Q50 64.2 53 61.5 Q50 62.6 47 61.5Z" fill={`url(#${id}-lip)`} />
        <path d="M46.2 61 Q50 62 53.8 61" stroke="#9c4a56" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </g>
    );
  return (
    <g>
      <path d="M45.3 60.2 Q50 61.4 54.7 60.2 Q52.6 65.6 50 65.6 Q47.4 65.6 45.3 60.2Z" fill="#8f3446" />
      <path d="M46.2 60.6 Q50 61.6 53.8 60.6 L53.4 61.6 Q50 62.4 46.6 61.6Z" fill="#fbf7f4" />
      <path d="M47.6 64.2 Q50 65.6 52.4 64.2 Q50 65.9 47.6 64.2Z" fill="#e08a95" />
      <path d="M44.6 60.1 Q45.2 59.6 45.8 60.3 M55.4 60.1 Q54.8 59.6 54.2 60.3" stroke="#a65a62" strokeWidth="0.5" fill="none" strokeLinecap="round" />
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
          <stop offset="0" stopColor="#e7929b" />
          <stop offset="1" stopColor="#c9636f" />
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

      {/* cuello */}
      <path d="M44.6 56 L55.4 56 L56.4 74 Q50 78 43.6 74Z" fill={u('limb')} />
      <path d="M44.8 61 Q50 66 55.2 61 L55.5 66 Q50 69 44.5 66Z" fill={SKIN_SH} opacity="0.7" />

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
        <path d="M31 38 Q31 17 50 16 Q69 17 69 38 Q69 52 64 60 Q57 70 50 71 Q43 70 36 60 Q31 52 31 38Z" fill={u('skin')} />
        {/* sombras de la cara */}
        <path d="M31.5 44 Q33 58 42 66 Q37 64 34 58 Q31.5 52 31.5 44Z" fill={SKIN_SH} opacity="0.45" />
        <path d="M68.5 44 Q67 58 58 66 Q63 64 66 58 Q68.5 52 68.5 44Z" fill={SKIN_SH} opacity="0.45" />
        <path d="M31 36 Q50 27 69 36 L69 41 Q50 32 31 41Z" fill={SKIN_SH} opacity="0.35" />
        <ellipse cx="38.5" cy="53.5" rx="4.4" ry={blush ? 2.4 : 1.8} fill="#f08ea8" opacity={blush ? 0.6 : 0.28} />
        <ellipse cx="61.5" cy="53.5" rx="4.4" ry={blush ? 2.4 : 1.8} fill="#f08ea8" opacity={blush ? 0.6 : 0.28} />
        {blush && <path d="M36 52.5 l1.2 -1.4 M38.5 52.6 l1.2 -1.4 M61 52.6 l1.2 -1.4 M63.5 52.5 l1.2 -1.4" stroke="#e0607f" strokeWidth="0.4" opacity="0.7" />}

        {/* cejas */}
        <path d="M36.6 39.4 Q41 36.3 47.2 38 L47 39.2 Q41.5 37.9 37.1 40.3Z" fill={hairDark} />
        <path d="M63.4 39.4 Q59 36.3 52.8 38 L53 39.2 Q58.5 37.9 62.9 40.3Z" fill={hairDark} />
        <Eyes mood={mood} id={id} iris={m.iris} />

        {/* nariz */}
        <path d="M49.2 46.5 Q48.2 51.5 48.4 54.2" stroke={SKIN_SH} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M47.6 55.2 Q48.6 56.4 50 56 Q51.4 56.4 52.4 55.2" stroke="#c98d76" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        <ellipse cx="50.7" cy="52.2" rx="0.55" ry="1.7" fill="#fff" opacity="0.5" />
        <Mouth mood={mood} id={id} />
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
        <path d="M35 24 Q50 15.5 65 24" stroke={shade(m.hair, 0.6)} strokeWidth="2.2" strokeDasharray="3.2 1.6" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}
