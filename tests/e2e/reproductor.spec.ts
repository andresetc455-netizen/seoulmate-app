import { expect, test } from '@playwright/test';

const PASS = 'clave-secreta';
const FX = 'tests/fixtures/';
const SHOTS = 'docs/screenshots';

test('K-Drama: capítulos del teléfono con subtítulos, progreso y siguiente capítulo', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await page.getByRole('button', { name: '+ Drama' }).click();
  await page.getByRole('dialog').locator('input').first().fill('Goblin');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await page.getByTestId('drama').filter({ hasText: 'Goblin' }).click();

  // Elige dos capítulos desordenados y el subtítulo del primero.
  await page.getByTestId('local-episodes-input').setInputFiles([FX + 'Goblin.S01E02.webm', FX + 'Goblin.S01E01.srt', FX + 'Goblin.S01E01.webm']);
  const eps = page.getByTestId('local-episode');
  await expect(eps).toHaveCount(2);
  await expect(eps.first()).toContainText('Goblin.S01E01.webm');
  await page.screenshot({ path: `${SHOTS}/50-capitulos.png` });

  await eps.first().click();
  const video = page.getByTestId('local-video');
  await expect(video).toBeVisible();
  await expect(page.locator('.video-name')).toHaveText('Capítulo 1');
  await expect(video.locator('track')).toHaveCount(1);
  // Al terminar pasa solo al capítulo 2.
  await expect(page.locator('.video-name')).toHaveText('Capítulo 2', { timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/51-reproductor.png` });
  await page.getByRole('button', { name: '✕ Cerrar' }).click();

  // El progreso queda guardado en el drama y el drama pasa a "En curso".
  await expect(page.getByTestId('watch-summary')).toContainText('capítulo 2');
  await expect(page.getByTestId('watch-summary')).toContainText('1 capítulo terminado');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'En curso' })).toHaveAttribute('aria-pressed', 'true');
});
