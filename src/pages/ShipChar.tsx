// Personajes de Ships en estilo webtoon semi-realista (dibujos originales en SVG):
// proporciones naturales, ojos almendrados con párpado y brillo, nariz y labios definidos,
// pelo en capas con sombra y reflejos, ropa con pliegues y luz lateral suave.
// Si el integrante tiene foto (perfil o favorita de la Galería), Ships usa la foto en su lugar.
import { useId } from 'react';
import { useDoc } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { useMedia } from '../lib/media';
import type { HairStyle, Mood, ShipMember } from '../lib/ships';

// ---------- color ----------
function mix(hex: string, to: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(to);
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
const light = (h: string, t: number) => mix(h, '#ffffff', t);
const dark = (h: string, t: number) => mix(h, '#000000', t);

// La cabeza se dibuja en su propio sistema (0..120) y se escala para lograr proporciones adultas.
const HEAD = 'translate(12.6 3) scale(0.79)';

// ---------- pelo ----------
type Pt = [number, number];

/** Flequillo en mechones con puntas finas + contorno superior de la cabeza. */
function bangs(tips: Pt[], notchY: number, flow: (x: number) => number, top = 6): string {
  let d = 'M26 76';
  let prev: Pt = [26, 76];
  const pts: Pt[] = [];
  tips.forEach((t, i) => {
    pts.push(t);
    const nx = tips[i + 1];
    if (nx) pts.push([(t[0] + nx[0]) / 2 + flow(t[0]) * 1.5, notchY + Math.abs(t[0] - 60) * 0.16]);
  });
  pts.push([94, 76]);
  for (const p of pts) {
    const cx = (prev[0] + p[0]) / 2 + flow(p[0]) * 2.6;
    const cy = (prev[1] + p[1]) / 2 + (p[1] > prev[1] ? -2.5 : 2.5);
    d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    prev = p;
  }
  return `${d} C100 ${top + 24} 84 ${top} 60 ${top} C36 ${top} 20 ${top + 24} 26 76 Z`;
}

const outward = (x: number) => (x < 60 ? -1 : 1);
const LOCKS = 'M29 60 Q27 76 31 88 Q32 76 35 64 Z M91 60 Q93 76 89 88 Q88 76 85 64 Z';
const LOCKS_SHORT = 'M29 62 Q28 72 31 80 Q32 72 34 65 Z M91 62 Q92 72 89 80 Q88 72 86 65 Z';
const BACK = 'M27 70 C22 34 40 9 60 9 C80 9 98 34 93 70 C92 76 90 80 87 82 L33 82 C30 80 28 76 27 70Z';

interface HairDef {
  front: string;
  back?: string;
  locks?: string;
  sides?: string;
  curls?: Pt[];
}

function hairFor(style: HairStyle): HairDef {
  switch (style) {
    case 'side':
      return { front: bangs([[29, 62], [35, 55], [42, 51], [50, 47], [58, 45], [67, 43], [76, 46], [85, 52], [92, 62]], 34, () => -1, 5), back: BACK, locks: LOCKS_SHORT };
    case 'curtain':
      return { front: bangs([[29, 70], [33, 61], [39, 54], [47, 47], [55, 40], [65, 40], [73, 47], [81, 54], [87, 61], [91, 70]], 31, outward, 6), back: BACK, locks: LOCKS };
    case 'mullet':
      return {
        front: bangs([[29, 68], [36, 64], [43, 61], [50, 64], [57, 60], [64, 64], [71, 61], [78, 64], [85, 61], [91, 68]], 44, (x) => (x < 60 ? 0.5 : -0.5), 6),
        back: 'M24 74 C18 34 38 8 60 8 C82 8 102 34 96 74 C96 92 92 106 86 118 L80 110 L74 122 L46 122 L40 110 L34 118 C28 106 24 92 24 74Z',
        locks: LOCKS,
      };
    case 'wavy':
      return { front: bangs([[29, 62], [37, 55], [45, 59], [53, 52], [61, 57], [69, 52], [77, 58], [85, 54], [91, 62]], 42, (x) => Math.sin(x / 5), 3), back: BACK, locks: LOCKS_SHORT };
    case 'fluffy':
      return { front: bangs([[29, 66], [35, 58], [42, 62], [49, 55], [56, 61], [63, 54], [70, 60], [77, 55], [84, 61], [91, 66]], 42, (x) => (x - 60) / 34, 4), back: BACK, locks: LOCKS };
    case 'shaggy':
      return {
        front: bangs([[28, 76], [32, 65], [39, 58], [46, 62], [53, 53], [59, 46], [65, 52], [72, 61], [79, 57], [86, 64], [92, 76]], 38, outward, 5),
        back: 'M24 74 C18 34 38 8 60 8 C82 8 102 34 96 74 C96 90 92 102 86 112 L80 104 L74 116 L46 116 L40 104 L34 112 C28 102 24 90 24 74Z',
        locks: LOCKS,
      };
    case 'curly': {
      const curls: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (1.1 - i * 0.1);
        curls.push([60 + Math.cos(a) * 33, 58 - Math.sin(a) * 40]);
      }
      [[38, 42], [47, 37], [56, 34], [65, 35], [74, 38], [82, 44], [46, 24], [60, 18], [74, 24]].forEach((p) => curls.push(p as Pt));
      return { front: bangs([[29, 58], [37, 50], [46, 52], [55, 48], [64, 51], [73, 48], [83, 52], [91, 58]], 38, () => 0, 4), back: BACK, curls };
    }
    case 'long':
      return {
        front: bangs([[28, 82], [31, 68], [36, 59], [43, 52], [51, 46], [59, 41], [67, 44], [76, 50], [84, 57], [89, 67], [92, 82]], 34, () => 1, 5),
        back: 'M24 66 C16 28 40 6 60 6 C80 6 104 28 96 66 C102 110 104 170 110 232 L84 226 L80 160 L40 160 L36 226 L10 232 C16 170 18 110 24 66Z',
        sides: 'M27 70 C20 112 22 172 14 232 L32 228 Q38 190 38 150 C38 122 37 98 37 82 Z M93 70 C100 112 98 172 106 232 L88 228 Q82 190 82 150 C82 122 83 98 83 82 Z',
      };
  }
}

// ---------- rasgos ----------
const LINE = '#3a2a2c';

/** Ojo izquierdo (el derecho se espeja): almendrado, con pliegue del párpado, iris con brillo y pestañas. */
function Eye({ cx, mood, closed, gid, flip, skinShade }: { cx: number; mood: Mood; closed: boolean; gid: string; flip: boolean; skinShade: string }) {
  const y = 71;
  const shape = `M${cx - 8} ${y} Q${cx - 1} ${y - 6.6} ${cx + 8} ${y - 1.4} Q${cx + 1} ${y + 5} ${cx - 8} ${y}Z`;
  const t = flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined;
  const clip = `${gid}-eye${flip ? 'R' : 'L'}`;
  if (closed) {
    const up = mood === 'happy' || mood === 'love';
    return (
      <g transform={t}>
        <path
          d={up ? `M${cx - 8} ${y + 0.5} Q${cx} ${y - 5} ${cx + 8} ${y}` : `M${cx - 8} ${y - 1} Q${cx} ${y + 3.6} ${cx + 8} ${y - 1.2}`}
          stroke={LINE}
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
        />
        {!up && <path d={`M${cx - 6} ${y + 1.4} l-1.2 2 M${cx - 2} ${y + 2.4} l-0.6 2.2 M${cx + 2} ${y + 2.4} l0.2 2.2`} stroke={LINE} strokeWidth="0.8" strokeLinecap="round" />}
        <path d={`M${cx - 6.5} ${y - 5.6} Q${cx} ${y - 8.6} ${cx + 7} ${y - 5}`} stroke={skinShade} strokeWidth="0.9" fill="none" opacity="0.7" />
      </g>
    );
  }
  const ix = cx + 0.4 + (mood === 'blush' ? -2 : 0); // de reojo, hacia afuera, cuando le da vergüenza
  return (
    <g transform={t}>
      <defs>
        <clipPath id={clip}>
          <path d={shape} />
        </clipPath>
      </defs>
      <path d={shape} fill="#fbf7f4" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={ix} cy={y - 0.6} r="4.4" fill={`url(#${gid}-iris)`} />
        <circle cx={ix} cy={y - 0.6} r="1.9" fill="#120c10" />
        <path d={`M${cx - 8} ${y - 2} Q${cx} ${y - 7} ${cx + 8} ${y - 3} L${cx + 8} ${y - 0.4} Q${cx} ${y - 4.6} ${cx - 8} ${y + 0.6}Z`} fill={LINE} opacity="0.22" />
      </g>
      {mood === 'love' ? (
        <path d={`M${ix - 1.4} ${y - 2.4} q-1-1.2 0-1.9 q0.7-0.4 1.1 0.4 q0.4-0.8 1.1-0.4 q1 0.7 0 1.9 l-1.1 1z`} fill="#ffd3dd" />
      ) : (
        <circle cx={ix - 1.4} cy={y - 2.6} r="1.25" fill="#fff" />
      )}
      <circle cx={ix + 1.6} cy={y + 1} r="0.55" fill="#fff" opacity="0.85" />
      <path d={`M${cx - 8.4} ${y + 0.3} Q${cx - 1} ${y - 7.4} ${cx + 8.4} ${y - 1.6}`} stroke={LINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d={`M${cx - 8.2} ${y + 0.2} l-2.2 -1.5 M${cx - 6.4} ${y - 2.4} l-1.6 -1.6`} stroke={LINE} strokeWidth="1" strokeLinecap="round" />
      <path d={`M${cx - 6.5} ${y + 2.4} Q${cx} ${y + 4.8} ${cx + 7.4} ${y - 0.6}`} stroke={dark(skinShade, 0.25)} strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d={`M${cx - 6.5} ${y - 5.8} Q${cx} ${y - 9} ${cx + 7} ${y - 5.4}`} stroke={skinShade} strokeWidth="0.9" fill="none" opacity="0.75" />
    </g>
  );
}

function Brow({ cx, flip, color, mood }: { cx: number; flip: boolean; color: string; mood: Mood }) {
  const t = flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined;
  const lift = mood === 'blush' ? 1.6 : 0;
  return (
    <path
      transform={t}
      d={`M${cx - 9} 62.5 Q${cx - 2} ${58 - lift * 0.3} ${cx + 8} ${59.8 - lift} L${cx + 8} ${61.2 - lift} Q${cx - 2} ${60 - lift * 0.3} ${cx - 9} 64Z`}
      fill={color}
      opacity="0.9"
    />
  );
}

function Mouth({ mood, m, lip }: { mood: Mood; m: ShipMember; lip: string }) {
  if (mood === 'kiss') return <path d="M56.8 96 Q60 94.4 63.2 96 Q61.8 99.6 60 99.6 Q58.2 99.6 56.8 96Z" fill={lip} stroke={dark(lip, 0.3)} strokeWidth="0.5" />;
  if (mood === 'blush')
    return (
      <g>
        <path d="M55.5 96.4 Q58 95.6 60 96.4 Q62 95.6 64.5 96.6" stroke={dark(lip, 0.45)} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M56.5 97.4 Q60 99.4 63.5 97.4" stroke={lip} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
    );
  if (m.id === 'jhope' || mood === 'love' || m.eyeSmile)
    return (
      <g>
        <path d="M53.4 95 Q60 94 66.6 95 Q64.2 101.8 60 101.8 Q55.8 101.8 53.4 95Z" fill="#7d3340" />
        <path d="M54.6 95.3 Q60 94.7 65.4 95.3 L64.8 97 Q60 96.5 55.2 97Z" fill="#fbf7f4" />
        <path d="M56.5 100 Q60 101.6 63.5 100" stroke={lip} strokeWidth="1.2" fill="none" opacity="0.8" />
        <path d="M53.4 95 Q60 93.8 66.6 95" stroke={dark(lip, 0.45)} strokeWidth="0.8" fill="none" />
      </g>
    );
  return (
    <g>
      <path d="M53.8 95.8 Q57 94.9 60 95.8 Q63 94.9 66.2 95.8" stroke={dark(lip, 0.45)} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M55.6 96.8 Q60 100 64.4 96.8 Q60 98.2 55.6 96.8Z" fill={lip} opacity="0.75" />
      <path d="M57.5 98.6 Q60 99.2 62.5 98.6" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
    </g>
  );
}

// ---------- ropa (coordenadas del cuerpo) ----------
function Clothes({ m, gid }: { m: ShipMember; gid: string }) {
  const c = m.outfit;
  const deep = dark(c, 0.3);
  const shape = 'M6 168 C8 132 20 112 43 104 L51 99 Q60 106 69 99 L77 104 C100 112 112 132 114 168 Z';
  let detail = null;
  switch (m.wear) {
    case 'jacket':
      detail = (
        <g>
          <path d="M51 98 L60 168 L69 98 Q60 105 51 98Z" fill="#efe9e6" />
          <path d="M51 98 L60 168 L69 98" fill="none" stroke={deep} strokeWidth="0.8" />
          <path d="M51 98 L40 126 L52 121 L56 134 Z M69 98 L80 126 L68 121 L64 134 Z" fill={deep} />
          <path d="M40 126 L52 121 M80 126 L68 121" stroke={light(c, 0.25)} strokeWidth="0.6" />
        </g>
      );
      break;
    case 'blazer':
      detail = (
        <g>
          <path d="M50 98 L60 144 L70 98 Q60 105 50 98Z" fill="#faf7f5" />
          <path d="M55 99 L60 120 L65 99" fill="none" stroke="#d8cfd2" strokeWidth="0.6" />
          <path d="M50 98 L35 132 L49 127 L60 144 Z M70 98 L85 132 L71 127 L60 144 Z" fill={deep} />
          <path d="M35 132 L49 127 M85 132 L71 127" stroke={light(c, 0.3)} strokeWidth="0.6" />
          <circle cx="60" cy="152" r="1.6" fill={dark(c, 0.5)} />
        </g>
      );
      break;
    case 'hoodie':
      detail = (
        <g>
          <path d="M33 110 Q60 128 87 110 Q83 97 71 96 Q60 105 49 96 Q37 97 33 110Z" fill={deep} />
          <path d="M40 108 Q60 120 80 108" stroke={dark(c, 0.45)} strokeWidth="0.8" fill="none" />
          <path d="M55 114 q-1 12 0.5 22 M65 114 q1 12 -0.5 22" stroke={light(c, 0.65)} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </g>
      );
      break;
    case 'shirt':
      detail = (
        <g>
          {[10, 20, 30, 40, 80, 90, 100, 110].map((x) => <path key={x} d={`M${x} ${x < 60 ? 130 - x / 4 : 100 + x / 4} V168`} stroke={deep} strokeWidth="2.4" opacity="0.4" />)}
          <path d="M51 97 L45 113 L58 106 Z M69 97 L75 113 L62 106 Z" fill="#fbf7f4" stroke={deep} strokeWidth="0.5" />
          <path d="M60 106 V168" stroke={deep} strokeWidth="0.8" />
          {[118, 132, 146, 160].map((y) => <circle key={y} cx="62" cy={y} r="1" fill={dark(c, 0.45)} />)}
        </g>
      );
      break;
    case 'knit':
      detail = (
        <g>
          <path d="M49 97 Q60 108 71 97 L73 101 Q60 114 47 101Z" fill={deep} />
          {[20, 28, 36, 44, 76, 84, 92, 100].map((x) => <path key={x} d={`M${x} 124 Q${x + 1} 146 ${x} 168`} stroke={deep} strokeWidth="0.8" fill="none" opacity="0.35" />)}
        </g>
      );
      break;
    case 'tee':
      detail = <path d="M50 97 Q60 107 70 97 L71 100 Q60 111 49 100Z" fill={deep} />;
      break;
  }
  return (
    <g>
      <path d={shape} fill={c} />
      {m.id === 'jimin' && [[26, 136], [40, 152], [84, 140], [98, 156], [74, 160], [18, 160]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q-2-2.4 0-3.6 q1.2-0.6 2 0.6 q0.8-1.2 2-0.6 q2 1.2 0 3.6 l-2 1.8z`} fill="#c45470" opacity="0.85" />
      ))}
      {detail}
      <path d="M28 122 Q33 142 30 168 M92 122 Q87 142 90 168 M40 140 Q44 154 42 168 M80 140 Q76 154 78 168" stroke={dark(c, 0.4)} strokeWidth="1.1" fill="none" opacity="0.28" strokeLinecap="round" />
      <path d={shape} fill={`url(#${gid}-cloth)`} />
    </g>
  );
}

// ---------- personaje ----------
export function AnimeChar({ m, mood = 'happy', size = 120, head = false }: { m: ShipMember; mood?: Mood; size?: number; head?: boolean }) {
  const gid = `ac${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const skin = m.skin ?? '#f6dccd';
  const skinShade = mix(skin, '#b8705f', 0.38);
  const lip = mix(skin, '#c4596c', 0.55);
  const hairDark = dark(m.hair, 0.45);
  const hair = hairFor(m.style);
  const closed = mood === 'kiss' || (mood === 'happy' && !!m.eyeSmile);
  const blush = mood === 'blush' || mood === 'love' || mood === 'kiss';
  const face = 'M31 60 C31 38 44 28 60 28 C76 28 89 38 89 60 C89 78 84 92 73 102 Q66 108 60 108 Q54 108 47 102 C36 92 31 78 31 60Z';
  const vb = head ? [28, 0, 64, 84] : [0, 0, 120, 168];
  const hairFill = `url(#${gid}-hair)`;
  return (
    <svg viewBox={vb.join(' ')} width={size} height={(size * vb[3]) / vb[2]} aria-hidden="true" className="anime-svg">
      <defs>
        <linearGradient id={`${gid}-hair`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={light(m.hair, 0.3)} />
          <stop offset="0.35" stopColor={m.hair} />
          <stop offset="1" stopColor={dark(m.hair, 0.35)} />
        </linearGradient>
        <radialGradient id={`${gid}-iris`} cx="0.45" cy="0.65" r="0.65">
          <stop offset="0" stopColor={light(m.eyes, 0.5)} />
          <stop offset="0.55" stopColor={m.eyes} />
          <stop offset="1" stopColor={dark(m.eyes, 0.55)} />
        </radialGradient>
        <linearGradient id={`${gid}-cloth`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient id={`${gid}-skin`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={light(skin, 0.18)} />
          <stop offset="0.55" stopColor={skin} />
          <stop offset="1" stopColor={mix(skin, skinShade, 0.45)} />
        </linearGradient>
        <radialGradient id={`${gid}-blush`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e9798f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e9798f" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform={HEAD}>{hair.back && <path d={hair.back} fill={hairFill} />}</g>
      {m.highlights && m.style === 'long' && (
        <g transform={HEAD}>
          <path d="M22 96 Q16 160 14 226 M98 96 Q104 160 106 226" stroke={m.highlights} strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      <Clothes m={m} gid={gid} />
      {hair.sides && (
        <g transform={HEAD}>
          <path d={hair.sides} fill={hairFill} />
          {m.highlights && <path d="M27 110 Q24 170 20 226 M93 110 Q96 170 100 226" stroke={m.highlights} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.6" />}
        </g>
      )}

      {/* cuello con sombra de la mandíbula */}
      <path d="M51.5 76 L51 99 Q60 106 69 99 L68.5 76 Z" fill={`url(#${gid}-skin)`} />
      <path d="M51.5 80 Q60 92 68.5 80 L68.8 88 Q60 98 51.2 88Z" fill={skinShade} opacity="0.5" />
      <path d="M54 86 Q55 92 53 97 M66 86 Q65 92 67 97" stroke={skinShade} strokeWidth="0.6" fill="none" opacity="0.5" />

      <g transform={HEAD}>
        <path d="M31 64 Q24 62 25 72 Q26 82 33 82Z" fill={skin} />
        <path d="M89 64 Q96 62 95 72 Q94 82 87 82Z" fill={mix(skin, skinShade, 0.3)} />
        {m.earrings && (
          <>
            <circle cx="29" cy="83" r="1.8" fill="#f2efe9" stroke="#a69b8c" strokeWidth="0.5" />
            <circle cx="91" cy="83" r="1.8" fill="#f2efe9" stroke="#a69b8c" strokeWidth="0.5" />
          </>
        )}
        {/* cara: luz desde la izquierda, sombra suave en la mandíbula */}
        <path d={face} fill={`url(#${gid}-skin)`} />
        <path d="M89 62 C88 80 83 93 72 102 Q66 107 60 107.6 Q70 99 76 88 C82 78 86 70 89 62Z" fill={skinShade} opacity="0.45" />
        <path d={hair.front} fill={skinShade} opacity="0.4" transform="translate(1.5 3.2)" />
        <ellipse cx="42" cy="86" rx="8" ry="4.5" fill={`url(#${gid}-blush)`} opacity={blush ? 1 : 0.45} />
        <ellipse cx="78" cy="86" rx="8" ry="4.5" fill={`url(#${gid}-blush)`} opacity={blush ? 1 : 0.45} />

        <g className="anime-eyes">
          <Eye cx={47} mood={mood} closed={closed} gid={gid} flip={false} skinShade={skinShade} />
          <Eye cx={73} mood={mood} closed={closed} gid={gid} flip skinShade={skinShade} />
        </g>
        {/* nariz: puente con sombra, punta y aletas */}
        <path d="M57.5 72 Q56.4 80 56 85.5" stroke={skinShade} strokeWidth="1.1" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M55.4 87.4 Q58 89.4 60.4 88.6 Q63 89.4 64.8 87.4" stroke={dark(skinShade, 0.15)} strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="60.8" cy="85.4" rx="1.4" ry="1" fill="#fff" opacity="0.45" />
        <Mouth mood={mood} m={m} lip={lip} />
        <path d="M56 104 Q60 105.6 64 104" stroke={skinShade} strokeWidth="0.7" fill="none" opacity="0.5" />
        {m.dimples && mood !== 'kiss' && <path d="M51 96 q-0.9 1.4 0 2.4 M69 96 q0.9 1.4 0 2.4" stroke={skinShade} strokeWidth="1" fill="none" strokeLinecap="round" />}
        {m.moles?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.85" fill="#5a3a36" />)}
        {m.labret && <circle cx="60" cy="103.5" r="1.4" fill="#f2efe9" stroke="#8d8578" strokeWidth="0.4" />}

        {/* pelo de adelante en capas: sombra, base, mechones y reflejos */}
        <path d={hair.front} fill={hairDark} transform="translate(0 1.6)" opacity="0.9" />
        <path d={hair.front} fill={hairFill} />
        {hair.locks && <path d={hair.locks} fill={hairFill} />}
        {hair.curls?.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y + 1} r={i > 12 ? 8 : 9} fill={hairDark} />
            <circle cx={x} cy={y} r={i > 12 ? 8 : 9} fill={i % 2 ? m.hair : light(m.hair, 0.12)} />
            <path d={`M${x - 4} ${y - 3} q4 -3 8 0`} stroke={light(m.hair, 0.4)} strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        ))}
        {m.style !== 'curly' && (
          <>
            <path d="M40 40 Q47 52 44 62 M49 34 Q55 46 52 58 M60 30 Q63 42 61 54 M70 33 Q72 45 71 57 M80 39 Q82 50 83 60" stroke={hairDark} strokeOpacity="0.5" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M36 32 Q48 20 62 19 Q50 24 44 32 Z M66 19 Q78 21 86 31 Q76 25 68 24Z" fill="#fff" opacity="0.28" />
            <path d="M42 30 Q46 36 45 44 M52 23 Q55 30 54 38 M74 25 Q77 31 78 39" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" fill="none" strokeLinecap="round" />
          </>
        )}
        {m.highlights && m.style === 'long' && (
          <path d="M44 24 Q40 40 39 56 M57 16 Q53 32 52 44 M74 22 Q78 40 81 56" stroke={m.highlights} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
        )}
        <Brow cx={47} flip={false} color={hairDark} mood={mood} />
        <Brow cx={73} flip color={hairDark} mood={mood} />
        {m.glasses && (
          <g stroke="#2f3442" strokeWidth="1.3" fill="#e8eefb" fillOpacity="0.1">
            <rect x="37" y="63" width="20" height="16" rx="5" />
            <rect x="63" y="63" width="20" height="16" rx="5" />
            <path d="M57 69 Q60 67.4 63 69 M37 68 L31 66 M83 68 L89 66" fill="none" />
            <path d="M40 66 l4 -1 M66 66 l4 -1" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.9" />
          </g>
        )}
      </g>
    </svg>
  );
}

// ---------- versión con foto real ----------

/** Foto del integrante para Ships: su foto de perfil o, si no hay, su favorita de la Galería. */
export function useMemberPhoto(m: ShipMember): { src: string | null; remote: boolean } {
  const bts = useDoc(btsDoc);
  const member = bts.members.find((x) => x.name.toLowerCase() === m.name.toLowerCase());
  const own = useMedia(member?.avatarId ?? null);
  if (own) return { src: own, remote: false };
  const pick = (bts.gallery ?? []).find((g) => g.member.toLowerCase() === m.name.toLowerCase());
  return { src: pick?.thumb ?? null, remote: !!pick };
}

/** Personaje de la escena: foto real enmarcada si hay, si no la ilustración. */
export function ShipFigure({ m, mood = 'happy', size = 120, head = false }: { m: ShipMember; mood?: Mood; size?: number; head?: boolean }) {
  const { src, remote } = useMemberPhoto(m);
  if (!src) return <AnimeChar m={m} mood={mood} size={size} head={head} />;
  if (head) return <img className="ship-photo-head" src={src} alt="" referrerPolicy="no-referrer" />;
  return (
    <div className={`ship-photo mood-${mood}`} style={{ width: size, height: size * 1.4 }}>
      <div className="ship-photo-frame" style={{ width: size * 0.84, height: size * 1.08 }}>
        <img data-snap="img" src={src} alt="" crossOrigin={remote ? 'anonymous' : undefined} referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}
