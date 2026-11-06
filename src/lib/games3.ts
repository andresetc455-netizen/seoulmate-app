// Lógica pura de los juegos nuevos del gatito: "Pesca del día" y "Puntero láser".

// ---------- Pesca del día ----------
export const FISH_CASTS = 10;

export interface FishZone {
  start: number; // 0..1
  width: number;
}

/** Posición del indicador (0..1) que va y viene; la velocidad sube con cada tirada. */
export function fishPos(t: number, cast: number): number {
  const speed = 0.55 + cast * 0.09; // vueltas completas por segundo
  const x = (t * speed) % 2;
  return x <= 1 ? x : 2 - x;
}

/** Zona verde: cada tirada más angosta (de 30 % a 12 %). */
export function fishZone(cast: number, rnd = Math.random): FishZone {
  const width = Math.max(0.12, 0.3 - cast * 0.02);
  return { start: rnd() * (1 - width), width };
}

export type FishCatch = 'dorado' | 'pez' | 'bota';
export const FISH_POINTS: Record<FishCatch, number> = { dorado: 5, pez: 2, bota: 0 };

/** Centro de la zona = pez dorado; resto de la zona = pez; fuera = una bota vieja. */
export function castResult(pos: number, zone: FishZone): FishCatch {
  if (pos < zone.start || pos > zone.start + zone.width) return 'bota';
  const center = zone.start + zone.width / 2;
  return Math.abs(pos - center) <= zone.width * 0.18 ? 'dorado' : 'pez';
}

// ---------- Puntero láser ----------
export const LASER_SECONDS = 40;
export const LASER_NEAR = 0.28; // distancia (en proporción del área) a la que el gatito "juega"
export const LASER_CATCH = 0.06;

export interface LaserState {
  cat: { x: number; y: number };
  dot: { x: number; y: number };
  t: number;
  score: number; // décimas de segundo jugando cerca
  over: boolean;
  caught: boolean; // terminó porque se quedó sin vidas
  lives: number;
  grace: number; // segundos en que el gatito se queda jugando tras atrapar el punto
}

export function newLaser(): LaserState {
  return { cat: { x: 0.5, y: 0.8 }, dot: { x: 0.5, y: 0.3 }, t: 0, score: 0, over: false, caught: false, lives: 3, grace: 0 };
}

export function catSpeed(t: number): number {
  return 0.16 + t * 0.01; // proporción del área por segundo
}

export function stepLaser(s: LaserState, dt: number): LaserState {
  if (s.over) return s;
  const dx = s.dot.x - s.cat.x;
  const dy = s.dot.y - s.cat.y;
  const dist = Math.hypot(dx, dy);
  const t = s.t + dt;
  if (s.grace > 0) return { ...s, t, grace: Math.max(0, s.grace - dt), over: t >= LASER_SECONDS };
  if (dist <= LASER_CATCH) {
    const lives = s.lives - 1;
    // Lo atrapó: pierde una vida y el gatito vuelve a la esquina opuesta a jugar un ratito.
    const cat = { x: s.dot.x < 0.5 ? 0.9 : 0.1, y: s.dot.y < 0.5 ? 0.9 : 0.1 };
    return { ...s, t, cat, lives, grace: 0.8, over: lives <= 0 || t >= LASER_SECONDS, caught: lives <= 0 };
  }
  const step = Math.min(dist, catSpeed(s.t) * dt);
  const cat = { x: s.cat.x + (dx / dist) * step, y: s.cat.y + (dy / dist) * step };
  const score = s.score + (dist <= LASER_NEAR ? dt * 10 : 0);
  return { ...s, cat, t, score, over: t >= LASER_SECONDS };
}

export function moveDot(s: LaserState, x: number, y: number): LaserState {
  const c = (v: number) => Math.min(0.97, Math.max(0.03, v));
  return { ...s, dot: { x: c(x), y: c(y) } };
}

export function laserFinalScore(s: LaserState): number {
  return Math.round(s.score / 10) + (s.caught ? 0 : 10); // bonus por aguantar hasta el final
}
