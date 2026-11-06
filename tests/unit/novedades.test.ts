import { describe, expect, it } from 'vitest';
import { buildIcs, nextYearly, notifyDue, upcomingReminders } from '../../src/lib/reminders';
import { classify, isAboutBts, parseFeed } from '../../src/lib/news';
import { parseCommons } from '../../src/lib/commons';
import { importDiscography, DISCOGRAPHY, memberFact } from '../../src/lib/btsFacts';
import { castResult, fishPos, laserFinalScore, moveDot, newLaser, stepLaser, LASER_SECONDS } from '../../src/lib/games3';
import type { BtsData, ChapterData, PersonalData } from '../../src/lib/types';

const now = new Date(2026, 8, 10, 12); // 10/09/2026
const chapter: ChapterData = { togetherSince: '2024-09-15', timeline: [], photos: [], letters: [], occasions: [], surprises: [], plans: [] };
const personal: PersonalData = { diary: [], tasks: [], goals: [] };

describe('recordatorios', () => {
  it('próxima fecha anual, incluido hoy y el 29/02', () => {
    expect(nextYearly('09-12', now)).toBe('2026-09-12');
    expect(nextYearly('09-10', now)).toBe('2026-09-10');
    expect(nextYearly('03-09', now)).toBe('2027-03-09');
    expect(nextYearly('02-29', now)).toBe('2027-02-28');
  });
  it('cumpleaños, aniversario, cartas y tareas (vencidas como hoy)', () => {
    const r = upcomingReminders(
      {
        chapter: { ...chapter, letters: [{ id: 'l1', title: 'Secreta', body: 'x', unlockDate: '2026-09-11', openedAt: null, createdAt: 0 }] },
        personal: { ...personal, tasks: [{ id: 't1', text: 'Comprar entradas', due: '2026-09-01', done: false, doneAt: null, createdAt: 0 }] },
      },
      now,
      10,
    );
    expect(r.map((x) => [x.title, x.days])).toEqual([
      ['Tarea atrasada: Comprar entradas', 0],
      ['Se abre una carta para vos', 1],
      ['Cumpleaños de RM', 2],
      ['Aniversario: 2 años juntos', 5],
    ]);
    expect(r.some((x) => x.title.includes('Secreta'))).toBe(false);
  });
  it('mesiversario dentro del mes', () => {
    const r = upcomingReminders({ chapter: { ...chapter, togetherSince: '2025-01-20' }, personal }, now, 15);
    expect(r.find((x) => x.id === 'nos:mes')?.date).toBe('2026-09-20');
  });
  it('archivo de calendario válido con repetición anual', () => {
    const ics = buildIcs([{ id: 'bts:09-12', date: '2026-09-12', title: 'Cumpleaños de RM', emoji: '🎂', yearly: true }], new Date(Date.UTC(2026, 0, 1)));
    expect(ics).toContain('DTSTART;VALUE=DATE:20260912');
    expect(ics).toContain('DTEND;VALUE=DATE:20260913');
    expect(ics).toContain('RRULE:FREQ=YEARLY');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  });
  it('avisa una sola vez por fecha', async () => {
    const r = upcomingReminders({ chapter, personal }, new Date(2026, 8, 12, 9), 1);
    const once = await notifyDue(r, [], new Date(2026, 8, 12, 9));
    expect(once.length).toBe(1);
    expect(await notifyDue(r, once, new Date(2026, 8, 12, 9))).toBe(once);
  });
});

describe('noticias', () => {
  it('filtra lo que no es de BTS y clasifica', () => {
    expect(isAboutBts('Nueva antena BTS en la ciudad')).toBe(true); // ambiguo: lo acepta
    expect(isAboutBts('El dólar hoy')).toBe(false);
    const n = classify({ title: 'Jung Kook anuncia gira mundial y nuevo álbum', link: 'https://x', source: 'S', date: '2026-09-01T00:00:00Z' });
    expect(n.topics).toEqual(['gira', 'musica']);
    expect(n.members).toEqual(['Jung Kook']);
  });
  it('parsea, deduplica y ordena', () => {
    const f = parseFeed({
      updatedAt: '2026-09-02T00:00:00Z',
      items: [
        { title: 'BTS gana un premio', link: 'https://a', source: 'A', date: '2026-09-01T00:00:00Z' },
        { title: 'BTS gana un premio!', link: 'https://b', source: 'B', date: '2026-09-01T01:00:00Z' },
        { title: 'Jimin en Billboard', link: 'https://c', source: 'C', date: '2026-09-02T00:00:00Z' },
        { title: 'Otra cosa', link: 'https://d', source: 'D', date: '2026-09-03T00:00:00Z' },
        { title: 'BTS link raro', link: 'javascript:alert(1)', source: 'E', date: '2026-09-03T00:00:00Z' },
      ],
    });
    expect(f.items.map((i) => i.link)).toEqual(['https://c', 'https://a']);
  });
});

describe('galería y contenido', () => {
  it('lee la respuesta de Commons con autoría y filtra por integrante', () => {
    const json = {
      query: {
        pages: {
          '1': { title: 'File:Jungkook 2022.jpg', index: 2, imageinfo: [{ thumburl: 'https://upload.wikimedia.org/a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:a', extmetadata: { Artist: { value: '<a href="x">Korea.net</a>' }, LicenseShortName: { value: 'CC BY-SA 2.0' } } }] },
          '2': { title: 'File:Otro.jpg', index: 1, imageinfo: [{ thumburl: 'https://upload.wikimedia.org/b.jpg' }] },
          '3': { title: 'File:Jungkook mal.jpg', index: 3, imageinfo: [{ thumburl: 'https://evil.example/c.jpg' }] },
        },
      },
      continue: { gsroffset: 40 },
    };
    const r = parseCommons(json, /Jung ?kook/i);
    expect(r.photos).toHaveLength(1);
    expect(r.photos[0]).toMatchObject({ author: 'Korea.net', license: 'CC BY-SA 2.0' });
    expect(r.next).toBe(40);
  });
  it('importa la discografía sin duplicar', () => {
    const d: BtsData = { songs: [{ id: 's', title: 'dynamite', album: '', note: '', favorite: true, createdAt: 0 }], albums: [], members: [], photocards: [], memories: [], lists: [] };
    const a = importDiscography(d);
    expect(a.data.albums).toHaveLength(DISCOGRAPHY.length);
    expect(a.data.songs.filter((s) => s.title.toLowerCase() === 'dynamite')).toHaveLength(1);
    expect(importDiscography(a.data).added).toBe(0);
    expect(memberFact('jung kook')?.birthday).toBe('1997-09-01');
    expect(memberFact('J-Hope')?.realName).toBe('Jung Ho-seok');
  });
});

describe('juegos del gatito', () => {
  it('pesca: indicador va y viene, zonas', () => {
    expect(fishPos(0, 0)).toBe(0);
    expect(fishPos(1 / 0.55, 0)).toBeCloseTo(1);
    const zone = { start: 0.4, width: 0.2 };
    expect(castResult(0.5, zone)).toBe('dorado');
    expect(castResult(0.42, zone)).toBe('pez');
    expect(castResult(0.1, zone)).toBe('bota');
  });
  it('láser: suma cerca, atrapa y termina por tiempo', () => {
    let s = moveDot(newLaser(), 0.5, 0.6);
    s = stepLaser(s, 0.1);
    expect(s.score).toBeGreaterThan(0);
    for (let i = 0; i < 200 && s.lives === 3; i++) s = stepLaser(s, 0.05);
    expect(s.lives).toBe(2);
    expect(s.over).toBe(false);
    for (let i = 0; i < 2000 && !s.over; i++) s = moveDot(stepLaser(s, 0.05), 0.5, 0.6);
    expect(s.over).toBe(true);
    let far = moveDot(newLaser(), 0.03, 0.03);
    far = { ...far, cat: { x: 0.97, y: 0.97 }, t: LASER_SECONDS - 0.01 };
    far = stepLaser(far, 0.05);
    expect(far.over && !far.caught).toBe(true);
    expect(laserFinalScore(far)).toBe(10);
  });
});
