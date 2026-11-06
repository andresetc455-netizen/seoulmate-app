// Ships de BTS: avatares chibi dibujados (sin fotos), acciones tiernas y apodos editables.

export type HairStyle = 'side' | 'curtain' | 'mullet' | 'wavy' | 'fluffy' | 'shaggy' | 'curly' | 'long';
export type Outfit = 'jacket' | 'hoodie' | 'shirt' | 'knit' | 'tee' | 'blazer';

export interface ShipMember {
  id: string;
  name: string;
  emoji: string;
  hair: string; // color base del pelo
  outfit: string; // color de la ropa
  style: HairStyle;
  wear: Outfit;
  eyes: string; // color del iris
  skin?: string;
  bts?: boolean;
  glasses?: boolean;
  labret?: boolean;
  highlights?: string;
  moles?: Array<[number, number]>; // lunares característicos (coordenadas del dibujo)
  dimples?: boolean;
  earrings?: boolean;
  eyeSmile?: boolean; // los ojos se cierran al sonreír
}

// Personajes estilo anime inspirados en rasgos conocidos de cada uno (dibujos originales, sin fotos).
export const SHIP_MEMBERS: ShipMember[] = [
  { id: 'rm', name: 'RM', emoji: '🐨', hair: '#2b2433', outfit: '#6f7d5c', style: 'side', wear: 'jacket', eyes: '#4a3428', dimples: true },
  { id: 'jin', name: 'Jin', emoji: '🐹', hair: '#3a2a26', outfit: '#f2a7bf', style: 'curtain', wear: 'knit', eyes: '#523a2c' },
  { id: 'suga', name: 'SUGA', emoji: '🐱', hair: '#1d1a22', outfit: '#3e4352', style: 'mullet', wear: 'hoodie', eyes: '#3c2c26', skin: '#fff1e6' },
  { id: 'jhope', name: 'j-hope', emoji: '🐿️', hair: '#2e2026', outfit: '#f3c34f', style: 'wavy', wear: 'shirt', eyes: '#4d3226', earrings: true },
  { id: 'jimin', name: 'Jimin', emoji: '🐥', hair: '#d8b56a', outfit: '#f6f0f5', style: 'fluffy', wear: 'blazer', eyes: '#5a3d2b', eyeSmile: true, earrings: true },
  { id: 'v', name: 'V', emoji: '🐯', hair: '#2a2230', outfit: '#3f5f8f', style: 'shaggy', wear: 'blazer', eyes: '#3d2a22', moles: [[61.6, 87.6]], earrings: true },
  { id: 'jk', name: 'Jung Kook', emoji: '🐰', hair: '#18151d', outfit: '#232028', style: 'fluffy', wear: 'jacket', eyes: '#3a2820', moles: [[57.4, 101.6]], earrings: true },
  // Ellos dos, dibujados a partir de sus fotos.
  { id: 'andres', name: 'Andrés', emoji: '🤓', hair: '#241a16', outfit: '#d9343c', style: 'curly', wear: 'tee', eyes: '#3d2a20', glasses: true },
  { id: 'nicole', name: 'Nicole', emoji: '💐', hair: '#16100e', outfit: '#2a2530', style: 'long', wear: 'knit', eyes: '#4a3024', labret: true, highlights: '#c99460' },
];

export const BTS_IDS = ['rm', 'jin', 'suga', 'jhope', 'jimin', 'v', 'jk'];

export const DEFAULT_NICKNAMES: Record<string, string> = { jimin: 'Hadita tucumana' };

export const NICKNAME_MAX = 30;
export const FORBIDDEN_NICKNAME_MSG = 'Error (Andrés es tu novio)';

export function memberById(id: string): ShipMember | undefined {
  return SHIP_MEMBERS.find((m) => m.id === id);
}

export function nicknamesOf(saved: Record<string, string> | undefined): Record<string, string> {
  return saved ?? DEFAULT_NICKNAMES;
}

export function displayName(id: string, saved: Record<string, string> | undefined): string {
  const nick = nicknamesOf(saved)[id]?.trim();
  return nick || memberById(id)?.name || id;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .replace(/(.)\1{2,}/g, '$1$1') // "amooor" → "amoor"
    .trim();

// Palabras que lo presentan como pareja de quien escribe.
const FORBIDDEN = [
  'amor', 'amorcito', 'amoor', 'mi amor', 'novio', 'noviecito', 'mi novio', 'novia', 'esposo', 'esposito', 'marido',
  'prometido', 'pareja', 'mi vida', 'mi cielo', 'mi rey', 'mi principe', 'mi hombre', 'mi chico', 'mi bebe', 'bebe',
  'bebito', 'beba', 'corazon', 'mi corazon', 'carino', 'mi alma', 'mi todo', 'mio', 'te amo', 'te quiero', 'mi crush',
  'crush', 'babe', 'baby', 'bby', 'boyfriend', 'bf', 'husband', 'hubby', 'honey', 'my love', 'darling', 'sweetheart',
  'oppa', 'yeobo', 'jagiya', 'jagi', 'saranghae', 'gordo', 'gordi', 'chiquito', 'cosita', 'precioso', 'papi',
];

export function isForbiddenNickname(text: string): boolean {
  const n = ` ${norm(text)} `;
  if (!n.trim()) return false;
  if (/(^| )am+o+r/.test(n) || /novi[oa]/.test(n)) return true;
  return FORBIDDEN.some((w) => n.includes(` ${w} `));
}

// Nombres de ship conocidos por el fandom; el resto se arma con las mitades.
const KNOWN: Record<string, string> = {
  'jimin+jk': 'Jikook',
  'jk+v': 'Taekook',
  'jimin+v': 'Vmin',
  'jin+rm': 'Namjin',
  'jimin+suga': 'Yoonmin',
  'jhope+suga': 'Sope',
  'jhope+v': 'Vhope',
  'jhope+jimin': 'Jihope',
  'jin+jk': 'Jinkook',
  'rm+v': 'Namtae',
  'jin+suga': 'Yoonjin',
  'rm+suga': 'Namgi',
  'jhope+jk': 'Hopekook',
  'jin+v': 'Taejin',
  'jimin+rm': 'Minjoon',
  'jhope+rm': 'Namseok',
  'jk+suga': 'Yoonkook',
  'jin+jimin': 'Jinmin',
  'jhope+jin': 'Jinhope',
  'jk+rm': 'Namkook',
  'suga+v': 'Taegi',
  'andres+nicole': 'Nicodrés',
};

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}

// Subgrupos conocidos por ARMY.
const GROUPS: Record<string, string> = {
  'jimin+jk+v': 'Maknae Line',
  'jhope+jin+rm+suga': 'Hyung Line',
  'jhope+rm+suga': 'Rap Line',
  'jimin+jin+jk+v': 'Vocal Line',
  'jin+rm+suga': 'Hyung Line (sin Hobi)',
  'jhope+jimin+jk+v': 'Dance & Maknae',
};

export function groupKey(ids: string[]): string {
  return [...ids].sort().join('+');
}

export function shipName(...ids: string[]): string {
  if (ids.length === 2) return KNOWN[pairKey(ids[0], ids[1])] ?? `${memberById(ids[0])?.name ?? ids[0]} × ${memberById(ids[1])?.name ?? ids[1]}`;
  const allBts = BTS_IDS.every((b) => ids.includes(b));
  if (allBts && ids.length === BTS_IDS.length) return 'OT7';
  if (allBts) return ids.includes('nicole') ? 'OT7 + Nicodrés' : 'OT8';
  return GROUPS[groupKey(ids)] ?? `OT${ids.length}`;
}

/** "A, B y C" */
export function joinNames(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

/** Compatibilidad fija por pareja (siempre alta, porque el amor gana). */
export function compatibility(...ids: string[]): number {
  const k = groupKey(ids);
  let h = 7;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return 82 + (h % 18);
}

export type Fx = 'hearts' | 'notes' | 'rain' | 'petals' | 'stars' | 'sparkles';
export type Move = 'none' | 'close' | 'touch';
export type Mood = 'love' | 'kiss' | 'blush' | 'happy';

export type Scene = 'cafe' | 'night' | 'rain' | 'park' | 'wedding' | 'kitchen' | 'karaoke' | 'sofa' | 'booth' | 'city';

export interface ShipAction {
  id: string;
  label: string;
  emoji: string;
  move: Move;
  fx: Fx;
  scene?: Scene;
  cat?: 'eat' | 'play' | 'pet' | 'sleepy' | 'gift' | 'listen'; // qué hace el gatito si está en la escena
  prop?: string;
  moodA: Mood;
  moodB: Mood;
  lines: string[]; // {a} y {b}
  groupLines: string[]; // {todos}, {a} (el primero) y {resto}
}

export const SHIP_ACTIONS: ShipAction[] = [
  {
    id: 'beso', cat: 'gift', label: 'Beso', emoji: '💋', move: 'touch', fx: 'hearts', moodA: 'kiss', moodB: 'kiss',
    lines: ['{a} y {b} se dan un beso de película 💋', '{a} le roba un beso a {b} y los dos se ponen rojos 😳', 'Muak 💜 {a} besó a {b} delante de ARMY'],
    groupLines: ['Ronda de besos: {todos} se dan besitos uno por uno 💋', '{a} le da un beso a cada uno: {resto} no saben dónde meterse 😳'],
  },
  {
    id: 'mejilla', cat: 'pet', label: 'Besito en el cachete', emoji: '😚', move: 'touch', fx: 'sparkles', moodA: 'kiss', moodB: 'blush',
    lines: ['{a} le da un besito en el cachete a {b}, que no sabe dónde meterse 🙈', '{b} recibe un piquito sorpresa de {a} 😚'],
    groupLines: ['Ronda de besitos en el cachete entre {todos} 😚', '{resto} le llenan los cachetes de besitos a {a} 🙈'],
  },
  {
    id: 'abrazo', cat: 'pet', label: 'Abrazo', emoji: '🤗', move: 'touch', fx: 'hearts', moodA: 'happy', moodB: 'love',
    lines: ['{a} abraza fuerte a {b} y no lo suelta más 🤗', 'Abrazo de oso entre {a} y {b} 🧸'],
    groupLines: ['¡Abrazo grupal! {todos} todos apretujados 🤗', '{a} abraza a {resto} y no los suelta más 🧸'],
  },
  {
    id: 'mano', cat: 'play', label: 'De la mano', emoji: '🫶', move: 'close', fx: 'sparkles', prop: '🫶', moodA: 'blush', moodB: 'blush',
    lines: ['{a} y {b} se toman de la mano “sin querer” 🫶', '{a} entrelaza los dedos con {b} en pleno ensayo 👀'],
    groupLines: ['{todos} hacen una ronda de la mano 🫶', '{a} agarra de la mano a {resto} y salen a pasear 💜'],
  },
  {
    id: 'cita', cat: 'eat', label: 'Cita en un café', emoji: '☕', move: 'close', fx: 'hearts', scene: 'cafe', prop: '☕🍰', moodA: 'love', moodB: 'happy',
    lines: ['{a} invita a {b} a un café en Seúl ☕', 'Cita secreta: {a} y {b} comparten una torta de frutilla 🍰'],
    groupLines: ['Cita múltiple en un café: {todos} comparten una torta gigante 🍰', '{a} invita a {resto} a tomar un café ☕'],
  },
  {
    id: 'baile', cat: 'play', label: 'Baile lento', emoji: '💃', move: 'touch', fx: 'notes', moodA: 'love', moodB: 'love',
    lines: ['{a} y {b} bailan lento como en un dorama 🎶', '{a} saca a bailar a {b} y lo hace girar 💫'],
    groupLines: ['{todos} bailan lento en ronda 🎶', 'Coreografía romántica: {a} baila con {resto} 💫'],
  },
  {
    id: 'serenata', cat: 'listen', label: 'Serenata', emoji: '🎤', move: 'none', fx: 'notes', prop: '🎤', moodA: 'happy', moodB: 'love',
    lines: ['{a} le canta una serenata a {b} 🎤', '{a} le dedica una canción a {b} y ARMY grita 😭'],
    groupLines: ['{a} les canta una serenata a {resto} 🎤', '{todos} cantan juntos una canción de amor 🎶'],
  },
  {
    id: 'paraguas', cat: 'listen', label: 'Bajo la lluvia', emoji: '☂️', move: 'touch', fx: 'rain', scene: 'rain', prop: '☂️', moodA: 'blush', moodB: 'love',
    lines: ['{a} comparte el paraguas con {b}, bien pegaditos ☂️', 'Escena de K-drama: {a} y {b} bajo la lluvia 🌧️'],
    groupLines: ['{todos} se apretujan bajo un solo paraguas ☂️', '{a} intenta tapar a {resto} con su paraguas y nadie entra 😂'],
  },
  {
    id: 'estrellas', cat: 'sleepy', label: 'Mirar estrellas', emoji: '🌙', move: 'close', fx: 'stars', scene: 'night', moodA: 'love', moodB: 'love',
    lines: ['{a} y {b} miran las estrellas en el Han 🌙', '{a} le dice a {b} que es su estrella favorita ✨'],
    groupLines: ['{todos} miran las estrellas acostados en el Han 🌙', '{a} le pide un deseo a una estrella por {resto} ✨'],
  },
  {
    id: 'picnic', cat: 'eat', label: 'Picnic', emoji: '🧺', move: 'close', fx: 'petals', scene: 'park', prop: '🧺🍓', moodA: 'happy', moodB: 'happy',
    lines: ['{a} le da frutillas en la boca a {b} 🍓', 'Picnic bajo los cerezos para {a} y {b} 🌸'],
    groupLines: ['Picnic gigante bajo los cerezos para {todos} 🌸', '{a} le da frutillas en la boca a {resto} 🍓'],
  },
  {
    id: 'boda', cat: 'gift', label: 'Casamiento', emoji: '💍', move: 'touch', fx: 'petals', scene: 'wedding', prop: '💍', moodA: 'love', moodB: 'love',
    lines: ['¡Sí, quiero! {a} y {b} se casan 💍', '{a} se arrodilla y le pide casamiento a {b} 💐'],
    groupLines: ['¡Casamiento múltiple! {todos} dicen “sí, quiero” 💍', '{a} les pide casamiento a {resto} y todos dicen que sí 💐'],
  },
  {
    id: 'selfie', cat: 'play', label: 'Selfie', emoji: '🤳', move: 'touch', fx: 'sparkles', scene: 'city', prop: '📱', moodA: 'happy', moodB: 'love',
    lines: ['{a} y {b} se sacan una selfie cachete con cachete 🤳', '{a} le pide una selfie a {b} y sale con los ojos cerrados 😂'],
    groupLines: ['Selfie grupal: {todos} apretados para entrar en la foto 🤳', '{a} intenta sacar una selfie con {resto} y nadie entra 📱'],
  },
  {
    id: 'cocinar', cat: 'eat', label: 'Cocinar juntos', emoji: '🍳', move: 'close', fx: 'sparkles', scene: 'kitchen', prop: '🍳🥘', moodA: 'happy', moodB: 'happy',
    lines: ['{a} y {b} cocinan ramyeon a medianoche 🍜', '{a} le enseña a {b} a hacer kimchi y terminan llenos de harina 🍳'],
    groupLines: ['{todos} cocinan juntos una cena coreana 🍳', '{a} cocina para {resto} y todos piden más 🥘'],
  },
  {
    id: 'karaoke', cat: 'listen', label: 'Karaoke', emoji: '🎙️', move: 'none', fx: 'notes', scene: 'karaoke', prop: '🎙️', moodA: 'happy', moodB: 'love',
    lines: ['{a} y {b} cantan a dúo en un noraebang 🎙️', '{a} le dedica una canción de BTS a {b} en el karaoke 🎶'],
    groupLines: ['Noche de karaoke: {todos} cantan a los gritos 🎙️', '{a} agarra el micrófono y {resto} hacen los coros 🎶'],
  },
  {
    id: 'kdrama', cat: 'sleepy', label: 'Ver un K-drama', emoji: '📺', move: 'touch', fx: 'hearts', scene: 'sofa', prop: '📺🍿', moodA: 'blush', moodB: 'love',
    lines: ['{a} y {b} ven un K-drama abrazados en el sillón 📺', '{a} llora con el final del dorama y {b} lo consuela 🥹'],
    groupLines: ['Maratón de K-dramas: {todos} en el mismo sillón 📺', '{a} elige el dorama y {resto} traen pochoclos 🍿'],
  },
  {
    id: 'cabina', cat: 'gift', label: 'Fotocabina', emoji: '📸', move: 'touch', fx: 'stars', scene: 'booth', prop: '📸', moodA: 'kiss', moodB: 'blush',
    lines: ['{a} y {b} se sacan fotos en una cabina de Hongdae 📸', 'Flash: {a} le da un beso a {b} justo en la última foto 📸'],
    groupLines: ['{todos} se apretujan en una fotocabina de Hongdae 📸', '{a} posa con {resto} con orejitas de conejo 🐰📸'],
  },
];

export function actionLine(action: ShipAction, names: string[], i = 0): string {
  if (names.length === 2) {
    const l = action.lines[i % action.lines.length];
    return l.replaceAll('{a}', names[0]).replaceAll('{b}', names[1]);
  }
  const l = action.groupLines[i % action.groupLines.length];
  return l.replaceAll('{todos}', joinNames(names)).replaceAll('{a}', names[0]).replaceAll('{resto}', joinNames(names.slice(1)));
}
