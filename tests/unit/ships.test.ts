import { describe, expect, it } from 'vitest';
import { actionLine, compatibility, displayName, FORBIDDEN_NICKNAME_MSG, isForbiddenNickname, shipName, SHIP_ACTIONS } from '../../src/lib/ships';

describe('ships', () => {
  it('apodos por defecto y editables', () => {
    expect(displayName('jimin', undefined)).toBe('Hadita tucumana');
    expect(displayName('jk', undefined)).toBe('Jung Kook');
    expect(displayName('jk', { jk: 'Kookie' })).toBe('Kookie');
    expect(displayName('jimin', {})).toBe('Jimin');
  });
  it('bloquea apodos de pareja', () => {
    for (const t of ['Mi amor', 'AMOOOR', 'mi novio', 'Novio de Nico', 'esposo', 'Bebé', 'mi vida', 'Corazón', 'baby', 'amorcito']) {
      expect(isForbiddenNickname(t), t).toBe(true);
    }
    for (const t of ['Hadita tucumana', 'Kookie', 'Conejito', 'Mochi', '']) expect(isForbiddenNickname(t), t).toBe(false);
    expect(FORBIDDEN_NICKNAME_MSG).toBe('Error (Andrés es tu novio)');
  });
  it('nombres y acciones', () => {
    expect(shipName('jk', 'jimin')).toBe('Jikook');
    expect(compatibility('v', 'jk')).toBe(compatibility('jk', 'v'));
    expect(shipName('jimin', 'v', 'jk')).toBe('Maknae Line');
    expect(shipName('rm', 'jin', 'suga', 'jhope', 'jimin', 'v', 'jk')).toBe('OT7');
    expect(shipName('rm', 'jimin', 'jk')).toBe('OT3');
    expect(compatibility('v', 'jk', 'rm')).toBe(compatibility('rm', 'v', 'jk'));
    const abrazo = SHIP_ACTIONS.find((a) => a.id === 'abrazo')!;
    expect(actionLine(abrazo, ['A', 'B', 'C'], 0)).toBe('¡Abrazo grupal! A, B y C todos apretujados 🤗');
    expect(actionLine(abrazo, ['A', 'B', 'C'], 1)).toBe('A abraza a B y C y no los suelta más 🧸');
    expect(actionLine(abrazo, ['A', 'B'], 0)).toContain('A abraza fuerte a B');
    for (const a of SHIP_ACTIONS) expect(a.groupLines.length).toBeGreaterThan(0);
    expect(new Set(SHIP_ACTIONS.map((a) => a.id)).size).toBe(SHIP_ACTIONS.length);
  });
});
