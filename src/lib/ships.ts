// Ships de BTS: personajes ilustrados (sin fotos), acciones tiernas y apodos editables.

export interface ShipMember {
  id: string;
  name: string;
  emoji: string;
  hair: string;
  iris: string;
  number: number; // dorsal: el día de su cumpleaños
  style: 'sweep' | 'soft' | 'curtain' | 'curly' | 'fluffy' | 'wavy' | 'mullet';
  extra?: 'dimples' | 'mole' | 'earring';
}

export const SHIP_MEMBERS: ShipMember[] = [
  { id: 'rm', iris: '#5a3d2b', name: 'RM', emoji: '🐨', hair: '#3b2f2f', number: 12, style: 'sweep', extra: 'dimples' },
  { id: 'jin', iris: '#4a2f22', name: 'Jin', emoji: '🐹', hair: '#5b3a2e', number: 4, style: 'soft' },
  { id: 'suga', iris: '#3b2a20', name: 'SUGA', emoji: '🐱', hair: '#8fd3c1', number: 9, style: 'curtain' },
  { id: 'jhope', iris: '#6a4630', name: 'j-hope', emoji: '🐿️', hair: '#7a4630', number: 18, style: 'curly' },
  { id: 'jimin', iris: '#5c3a28', name: 'Jimin', emoji: '🐥', hair: '#e8cf8f', number: 13, style: 'fluffy' },
  { id: 'v', iris: '#3d2a20', name: 'V', emoji: '🐯', hair: '#2c3150', number: 30, style: 'wavy', extra: 'mole' },
  { id: 'jk', iris: '#2e1f17', name: 'Jung Kook', emoji: '🐰', hair: '#1b1820', number: 1, style: 'mullet', extra: 'earring' },
];

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
  if (ids.length === SHIP_MEMBERS.length) return 'OT7';
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
export type Mood = 'love' | 'kiss' | 'blush' | 'happy' | 'smile';

export interface ShipAction {
  id: string;
  label: string;
  emoji: string;
  move: Move;
  fx: Fx;
  scene?: 'cafe' | 'night' | 'rain' | 'park' | 'wedding';
  prop?: string;
  moodA: Mood;
  moodB: Mood;
  lines: string[]; // {a} y {b}
  groupLines: string[]; // {todos}, {a} (el primero) y {resto}
}

export const SHIP_ACTIONS: ShipAction[] = [
  {
    id: 'beso', label: 'Beso', emoji: '💋', move: 'touch', fx: 'hearts', moodA: 'kiss', moodB: 'kiss',
    lines: ['{a} y {b} se dan un beso de película 💋', '{a} le roba un beso a {b} y los dos se ponen rojos 😳', 'Muak 💜 {a} besó a {b} delante de ARMY'],
    groupLines: ['Ronda de besos: {todos} se dan besitos uno por uno 💋', '{a} le da un beso a cada uno: {resto} no saben dónde meterse 😳'],
  },
  {
    id: 'mejilla', label: 'Besito en el cachete', emoji: '😚', move: 'touch', fx: 'sparkles', moodA: 'kiss', moodB: 'blush',
    lines: ['{a} le da un besito en el cachete a {b}, que no sabe dónde meterse 🙈', '{b} recibe un piquito sorpresa de {a} 😚'],
    groupLines: ['Ronda de besitos en el cachete entre {todos} 😚', '{resto} le llenan los cachetes de besitos a {a} 🙈'],
  },
  {
    id: 'abrazo', label: 'Abrazo', emoji: '🤗', move: 'touch', fx: 'hearts', moodA: 'happy', moodB: 'love',
    lines: ['{a} abraza fuerte a {b} y no lo suelta más 🤗', 'Abrazo de oso entre {a} y {b} 🧸'],
    groupLines: ['¡Abrazo grupal! {todos} todos apretujados 🤗', '{a} abraza a {resto} y no los suelta más 🧸'],
  },
  {
    id: 'mano', label: 'De la mano', emoji: '🫶', move: 'close', fx: 'sparkles', prop: '🫶', moodA: 'blush', moodB: 'blush',
    lines: ['{a} y {b} se toman de la mano “sin querer” 🫶', '{a} entrelaza los dedos con {b} en pleno ensayo 👀'],
    groupLines: ['{todos} hacen una ronda de la mano 🫶', '{a} agarra de la mano a {resto} y salen a pasear 💜'],
  },
  {
    id: 'cita', label: 'Cita en un café', emoji: '☕', move: 'close', fx: 'hearts', scene: 'cafe', prop: '☕🍰', moodA: 'love', moodB: 'happy',
    lines: ['{a} invita a {b} a un café en Seúl ☕', 'Cita secreta: {a} y {b} comparten una torta de frutilla 🍰'],
    groupLines: ['Cita múltiple en un café: {todos} comparten una torta gigante 🍰', '{a} invita a {resto} a tomar un café ☕'],
  },
  {
    id: 'baile', label: 'Baile lento', emoji: '💃', move: 'touch', fx: 'notes', moodA: 'love', moodB: 'love',
    lines: ['{a} y {b} bailan lento como en un dorama 🎶', '{a} saca a bailar a {b} y lo hace girar 💫'],
    groupLines: ['{todos} bailan lento en ronda 🎶', 'Coreografía romántica: {a} baila con {resto} 💫'],
  },
  {
    id: 'serenata', label: 'Serenata', emoji: '🎤', move: 'none', fx: 'notes', prop: '🎤', moodA: 'happy', moodB: 'love',
    lines: ['{a} le canta una serenata a {b} 🎤', '{a} le dedica una canción a {b} y ARMY grita 😭'],
    groupLines: ['{a} les canta una serenata a {resto} 🎤', '{todos} cantan juntos una canción de amor 🎶'],
  },
  {
    id: 'paraguas', label: 'Bajo la lluvia', emoji: '☂️', move: 'touch', fx: 'rain', scene: 'rain', prop: '☂️', moodA: 'blush', moodB: 'love',
    lines: ['{a} comparte el paraguas con {b}, bien pegaditos ☂️', 'Escena de K-drama: {a} y {b} bajo la lluvia 🌧️'],
    groupLines: ['{todos} se apretujan bajo un solo paraguas ☂️', '{a} intenta tapar a {resto} con su paraguas y nadie entra 😂'],
  },
  {
    id: 'estrellas', label: 'Mirar estrellas', emoji: '🌙', move: 'close', fx: 'stars', scene: 'night', moodA: 'love', moodB: 'love',
    lines: ['{a} y {b} miran las estrellas en el Han 🌙', '{a} le dice a {b} que es su estrella favorita ✨'],
    groupLines: ['{todos} miran las estrellas acostados en el Han 🌙', '{a} le pide un deseo a una estrella por {resto} ✨'],
  },
  {
    id: 'picnic', label: 'Picnic', emoji: '🧺', move: 'close', fx: 'petals', scene: 'park', prop: '🧺🍓', moodA: 'happy', moodB: 'happy',
    lines: ['{a} le da frutillas en la boca a {b} 🍓', 'Picnic bajo los cerezos para {a} y {b} 🌸'],
    groupLines: ['Picnic gigante bajo los cerezos para {todos} 🌸', '{a} le da frutillas en la boca a {resto} 🍓'],
  },
  {
    id: 'boda', label: 'Casamiento', emoji: '💍', move: 'touch', fx: 'petals', scene: 'wedding', prop: '💍', moodA: 'love', moodB: 'love',
    lines: ['¡Sí, quiero! {a} y {b} se casan 💍', '{a} se arrodilla y le pide casamiento a {b} 💐'],
    groupLines: ['¡Casamiento múltiple! {todos} dicen “sí, quiero” 💍', '{a} les pide casamiento a {resto} y todos dicen que sí 💐'],
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
