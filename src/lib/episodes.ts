// Utilidades del reproductor de capítulos guardados en el teléfono (los archivos nunca se suben ni se copian).

/** Número de episodio a partir del nombre del archivo: "S01E05", "Ep 5", "Episodio 05", "05.mp4"… */
export function parseEpisode(name: string): number | null {
  const base = name.replace(/\.[^.]+$/, '');
  const tagged = base.match(/s\d{1,2}\s*[._-]?\s*e(\d{1,3})/i) ?? base.match(/(?:^|[^a-z])(?:ep|e|episod(?:e|io)|cap(?:[ií]tulo)?)\s*[._-]?\s*(\d{1,3})(?!\d)/i);
  if (tagged) return Number(tagged[1]) || null;
  // Si no hay marca, el último número suelto que no sea calidad ni códec (720, 264…).
  const nums = [...base.matchAll(/(?:^|\D)(\d{1,3})(?=\D|$)/g)].map((m) => Number(m[1])).filter((n) => n > 0 && ![264, 265, 360, 480, 720].includes(n));
  return nums.length ? nums[nums.length - 1] : null;
}

/** Ordena por número de episodio y, si no hay, por nombre. */
export function sortEpisodes<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => {
    const ea = parseEpisode(a.name);
    const eb = parseEpisode(b.name);
    if (ea !== null && eb !== null && ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name, 'es', { numeric: true });
  });
}

export function fileKey(f: { name: string; size: number }): string {
  return `${f.name}|${f.size}`;
}

/** Subtítulos .srt → WebVTT (formato que entiende el navegador). */
export function srtToVtt(srt: string): string {
  const body = srt
    .replace(/^﻿/, '')
    .replace(/\r+/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .trim();
  return body.startsWith('WEBVTT') ? body : `WEBVTT\n\n${body}\n`;
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** Se retoma solo si quedó a mitad: ni en los primeros 20 s ni en el último minuto. */
export function resumeAt(time: number, duration: number): number | null {
  if (!duration || time < 20 || time > duration - 60) return null;
  return time;
}

/** Mismo nombre sin extensión: "Ep05.mp4" ↔ "Ep05.srt". */
export function sameBase(a: string, b: string): boolean {
  const base = (n: string) => n.replace(/\.[^.]+$/, '').toLowerCase();
  return base(a) === base(b);
}

/** Terminado: llegó a los créditos (último minuto, o el último 5 % en videos cortos). */
export function isDone(p: { time: number; duration: number }): boolean {
  return p.duration > 0 && p.time >= p.duration - Math.min(60, p.duration * 0.05);
}
