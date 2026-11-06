import { describe, expect, it } from 'vitest';
import { clock, parseEpisode, resumeAt, sameBase, sortEpisodes, srtToVtt } from '../../src/lib/episodes';

describe('capítulos del teléfono', () => {
  it('detecta el número de episodio en nombres comunes', () => {
    expect(parseEpisode('Goblin.S01E05.1080p.x264.mp4')).toBe(5);
    expect(parseEpisode('Crash Landing on You - Ep 12.mkv')).toBe(12);
    expect(parseEpisode('Capítulo 3.mp4')).toBe(3);
    expect(parseEpisode('Episodio_07_HD.mp4')).toBe(7);
    expect(parseEpisode('true beauty 16 720p.mp4')).toBe(16);
    expect(parseEpisode('trailer.mp4')).toBeNull();
  });
  it('ordena por episodio y no alfabéticamente', () => {
    const r = sortEpisodes([{ name: 'Ep 10.mp4' }, { name: 'Ep 2.mp4' }, { name: 'Ep 1.mp4' }]);
    expect(r.map((f) => f.name)).toEqual(['Ep 1.mp4', 'Ep 2.mp4', 'Ep 10.mp4']);
  });
  it('convierte subtítulos srt a vtt', () => {
    const v = srtToVtt('﻿1\r\n00:00:01,500 --> 00:00:03,000\r\nHola\r\n');
    expect(v.startsWith('WEBVTT\n\n1\n00:00:01.500 --> 00:00:03.000\nHola')).toBe(true);
  });
  it('retoma solo si quedó a mitad', () => {
    expect(resumeAt(10, 3600)).toBeNull();
    expect(resumeAt(1200, 3600)).toBe(1200);
    expect(resumeAt(3580, 3600)).toBeNull();
    expect(clock(3725)).toBe('1:02:05');
    expect(clock(65)).toBe('1:05');
    expect(sameBase('Ep05.mp4', 'ep05.srt')).toBe(true);
  });
});
