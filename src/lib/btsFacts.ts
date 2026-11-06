// Datos públicos y verificables de BTS: integrantes, discografía coreana principal y fechas ARMY.
// Fuentes: Wikipedia (discografía de BTS y páginas de cada integrante). Sin letras ni imágenes oficiales.
import type { BtsData } from './types';

export interface MemberFact {
  name: string; // nombre artístico, igual al usado en btsDoc
  realName: string;
  birthday: string; // YYYY-MM-DD
  solo: string[];
}

export const MEMBER_FACTS: MemberFact[] = [
  { name: 'RM', realName: 'Kim Nam-joon', birthday: '1994-09-12', solo: ['mono. (2018)', 'Indigo (2022)', 'Right Place, Wrong Person (2024)'] },
  { name: 'Jin', realName: 'Kim Seok-jin', birthday: '1992-12-04', solo: ['The Astronaut (2022)', 'Happy (2024)', 'Echo (2025)'] },
  { name: 'SUGA', realName: 'Min Yoon-gi', birthday: '1993-03-09', solo: ['Agust D (2016)', 'D-2 (2020)', 'D-DAY (2023)'] },
  { name: 'j-hope', realName: 'Jung Ho-seok', birthday: '1994-02-18', solo: ['Hope World (2018)', 'Jack In The Box (2022)', 'Hope on the Street Vol. 1 (2024)'] },
  { name: 'Jimin', realName: 'Park Ji-min', birthday: '1995-10-13', solo: ['FACE (2023)', 'MUSE (2024)'] },
  { name: 'V', realName: 'Kim Tae-hyung', birthday: '1995-12-30', solo: ['Layover (2023)'] },
  { name: 'Jung Kook', realName: 'Jeon Jung-kook', birthday: '1997-09-01', solo: ['GOLDEN (2023)'] },
];

export function memberFact(name: string): MemberFact | undefined {
  const n = name.trim().toLowerCase().replace(/[\s-]/g, '');
  return MEMBER_FACTS.find((m) => m.name.toLowerCase().replace(/[\s-]/g, '') === n);
}

export interface Release {
  title: string;
  year: number;
  kind: 'Álbum' | 'EP' | 'Recopilatorio' | 'Single';
  tracks: string[]; // canciones principales (títulos)
}

/** Lanzamientos principales en Corea, en orden cronológico. */
export const DISCOGRAPHY: Release[] = [
  { title: '2 Cool 4 Skool', year: 2013, kind: 'EP', tracks: ['No More Dream'] },
  { title: 'O!RUL8,2?', year: 2013, kind: 'EP', tracks: ['N.O'] },
  { title: 'Skool Luv Affair', year: 2014, kind: 'EP', tracks: ['Boy In Luv', 'Just One Day'] },
  { title: 'Dark & Wild', year: 2014, kind: 'Álbum', tracks: ['Danger', 'War of Hormone'] },
  { title: 'The Most Beautiful Moment in Life, Pt. 1', year: 2015, kind: 'EP', tracks: ['I Need U', 'Dope'] },
  { title: 'The Most Beautiful Moment in Life, Pt. 2', year: 2015, kind: 'EP', tracks: ['Run'] },
  { title: 'The Most Beautiful Moment in Life: Young Forever', year: 2016, kind: 'Recopilatorio', tracks: ['Fire', 'Save Me', 'Epilogue: Young Forever'] },
  { title: 'Wings', year: 2016, kind: 'Álbum', tracks: ['Blood Sweat & Tears'] },
  { title: 'You Never Walk Alone', year: 2017, kind: 'Recopilatorio', tracks: ['Spring Day', 'Not Today'] },
  { title: 'Love Yourself: Her', year: 2017, kind: 'EP', tracks: ['DNA', 'Mic Drop'] },
  { title: 'Love Yourself: Tear', year: 2018, kind: 'Álbum', tracks: ['Fake Love'] },
  { title: 'Love Yourself: Answer', year: 2018, kind: 'Recopilatorio', tracks: ['Idol'] },
  { title: 'Map of the Soul: Persona', year: 2019, kind: 'EP', tracks: ['Boy With Luv', 'Make It Right'] },
  { title: 'Map of the Soul: 7', year: 2020, kind: 'Álbum', tracks: ['ON', 'Black Swan'] },
  { title: 'Dynamite', year: 2020, kind: 'Single', tracks: ['Dynamite'] },
  { title: 'BE', year: 2020, kind: 'Álbum', tracks: ['Life Goes On'] },
  { title: 'Butter', year: 2021, kind: 'Single', tracks: ['Butter', 'Permission to Dance'] },
  { title: 'Proof', year: 2022, kind: 'Recopilatorio', tracks: ['Yet To Come', 'Run BTS'] },
  { title: 'Take Two', year: 2023, kind: 'Single', tracks: ['Take Two'] },
  { title: 'Arirang', year: 2026, kind: 'Álbum', tracks: ['Swim'] },
];

/** Fechas que ARMY celebra todos los años (MM-DD). */
export const ARMY_DATES: Array<{ md: string; title: string; emoji: string }> = [
  { md: '06-13', title: 'Aniversario del debut de BTS (2013)', emoji: '🎉' },
  { md: '07-09', title: 'Día de ARMY (2013)', emoji: '💜' },
  ...MEMBER_FACTS.map((m) => ({ md: m.birthday.slice(5), title: `Cumpleaños de ${m.name}`, emoji: '🎂' })),
];

/** Suma la discografía principal (álbumes y canciones principales) sin duplicar lo que ya está. */
export function importDiscography(d: BtsData, now = Date.now()): { data: BtsData; added: number } {
  const key = (t: string) => t.trim().toLowerCase();
  const albumTitles = new Set(d.albums.map((a) => key(a.title)));
  const songTitles = new Set(d.songs.map((s) => key(s.title)));
  const albums = [...d.albums];
  const songs = [...d.songs];
  let added = 0;
  DISCOGRAPHY.forEach((r, i) => {
    const t = now - i; // conserva el orden cronológico
    if (!albumTitles.has(key(r.title))) {
      albums.push({ id: crypto.randomUUID(), title: r.title, year: String(r.year), note: `${r.kind} · ${r.tracks.join(', ')}`, coverId: null, favorite: false, createdAt: t });
      albumTitles.add(key(r.title));
      added++;
    }
    for (const title of r.tracks) {
      if (songTitles.has(key(title))) continue;
      songs.push({ id: crypto.randomUUID(), title, album: `${r.title} (${r.year})`, note: '', favorite: false, createdAt: t });
      songTitles.add(key(title));
      added++;
    }
  });
  return { data: { ...d, albums, songs }, added };
}

