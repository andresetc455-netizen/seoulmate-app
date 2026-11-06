// Modelos de datos. Cada "documento" se guarda cifrado por separado:
// settings, pet, bts, dramas, chapter (romántico) y personal (diario), más media:<id> para imágenes.

export interface Settings {
  nickname: string;
  autoLockMinutes: number;
  authorPin: { salt: string; hash: string } | null;
  customPhrases: string[];
  onboarded: boolean;
  notify?: boolean; // avisos del sistema (fechas y noticias)
  notified?: string[]; // avisos ya mostrados, para no repetirlos
  newsSeenAt?: number; // última vez que miró las noticias
  newsNotifiedAt?: number;
  driveClientId?: string; // llave OAuth (pública) de Google para leer Drive
  driveFolder?: string; // carpeta de Drive con los capítulos (enlace o ID)
}

// ---------- BTS World ----------
export interface Song {
  id: string;
  title: string;
  album: string;
  note: string;
  link?: string; // enlace de YouTube o YouTube Music
  favorite: boolean;
  createdAt: number;
}
export interface Album {
  id: string;
  title: string;
  year: string;
  note: string;
  coverId: string | null;
  favorite: boolean;
  createdAt: number;
}
export interface Member {
  id: string;
  name: string;
  note: string;
  favorite: boolean;
  avatarId?: string | null;
  photos?: string[]; // ids de imágenes que ella sube
}
export type FrameStyle = 'estrellas' | 'cerezo' | 'encaje' | 'holo' | 'polaroid';
export interface Photocard {
  id: string;
  imageId: string;
  caption: string;
  member: string;
  collection: string;
  frame: FrameStyle;
  favorite: boolean;
  createdAt: number;
}
export interface FanMemory {
  id: string;
  title: string;
  date: string;
  note: string;
  createdAt: number;
}
export interface FanList {
  id: string;
  name: string;
  items: Array<{ id: string; text: string; favorite: boolean; done: boolean }>;
  createdAt: number;
}
export interface BtsData {
  songs: Song[];
  albums: Album[];
  members: Member[];
  photocards: Photocard[];
  memories: FanMemory[];
  lists: FanList[];
  nicknames?: Record<string, string>; // apodos editables para la sección Ships
  gallery?: GalleryPick[]; // fotos favoritas de la galería libre (Wikimedia Commons)
  shipFavs?: string[][]; // ships favoritos (ids de integrantes)
  shipMoments?: ShipMoment[]; // escenas guardadas como imagen
}
export interface ShipMoment {
  id: string;
  imageId: string;
  title: string;
  line: string;
  createdAt: number;
}
export interface GalleryPick {
  id: string; // título del archivo en Commons
  member: string;
  thumb: string;
  page: string; // página del archivo (autoría y licencia)
  author: string;
  license: string;
  savedAt: number;
}

// ---------- K-Drama Diary ----------
export type DramaStatus = 'pendiente' | 'en-curso' | 'terminado';
export interface EpisodeNote {
  id: string;
  episode: string;
  note: string;
}
export interface Drama {
  id: string;
  title: string;
  status: DramaStatus;
  genres: string[];
  moods: string[];
  rating: number; // 0 = sin puntuar, 1..5
  review: string;
  characters: string;
  actors: string;
  episodeNotes: EpisodeNote[];
  recommend: boolean;
  recommendNote: string;
  watchLink?: string; // dónde verlo: YouTube (se reproduce en la app) u otra plataforma (se abre afuera)
  watched?: WatchProgress[]; // capítulos vistos desde archivos del teléfono
  createdAt: number;
  updatedAt: number;
}
export interface WatchProgress {
  key: string; // nombre|tamaño del archivo
  name: string;
  ep: number | null;
  time: number; // segundos
  duration: number;
  at: number;
}
export interface DramaData {
  dramas: Drama[];
  cloudSeen?: Record<string, number>; // capítulos de Drive vistos (id de archivo → fecha)
}

// ---------- Nuestro capítulo (romántico) ----------
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  imageId: string | null;
}
export interface PhotoMemory {
  id: string;
  imageId: string;
  caption: string;
  date: string;
}
export interface Letter {
  id: string;
  title: string;
  body: string;
  unlockDate: string | null; // si existe, solo se puede leer desde esa fecha
  openedAt: number | null;
  createdAt: number;
}
export interface OccasionMessage {
  id: string;
  occasion: string;
  body: string;
}
export interface Surprise {
  id: string;
  title: string;
  message: string;
  imageId: string | null;
  unlockDate: string;
  openedAt: number | null;
}
export type PlanStatus = 'idea' | 'planeada' | 'hecha';
export interface DatePlan {
  id: string;
  title: string;
  inspiration: string;
  description: string;
  date: string | null;
  status: PlanStatus;
}
export interface ChapterData {
  togetherSince: string | null; // YYYY-MM-DD, fecha de inicio del contador (configurable)
  timeline: TimelineEvent[];
  photos: PhotoMemory[];
  letters: Letter[];
  occasions: OccasionMessage[];
  surprises: Surprise[];
  plans: DatePlan[];
}

// ---------- Diario y organización personal ----------
export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: string;
  createdAt: number;
  updatedAt: number;
}
export interface Task {
  id: string;
  text: string;
  due: string | null;
  done: boolean;
  doneAt: number | null;
  createdAt: number;
}
export interface Goal {
  id: string;
  title: string;
  note: string;
  progress: number; // 0..100
  targetDate: string | null;
  createdAt: number;
}
export interface PersonalData {
  diary: DiaryEntry[];
  tasks: Task[];
  goals: Goal[];
}
