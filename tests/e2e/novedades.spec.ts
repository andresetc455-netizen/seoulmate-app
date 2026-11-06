import { expect, test, type Page } from '@playwright/test';

const PASS = 'clave-secreta';
const SHOTS = 'docs/screenshots';

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
}

// Los service workers no pasan por page.route: se bloquean para simular las respuestas externas.
test.use({ serviceWorkers: 'block' });

const now = Date.now();
const NEWS = {
  updatedAt: new Date(now - 3600e3).toISOString(),
  items: [
    { title: 'BTS anuncia nuevas fechas de su gira mundial', link: 'https://example.com/1', source: 'Medio A', date: new Date(now - 2 * 3600e3).toISOString() },
    { title: 'Jimin rompe un récord en Spotify', link: 'https://example.com/2', source: 'Medio B', date: new Date(now - 5 * 3600e3).toISOString() },
    { title: 'El dólar hoy', link: 'https://example.com/3', source: 'Medio C', date: new Date(now - 3600e3).toISOString() },
  ],
};
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test.beforeEach(async ({ page }) => {
  await page.route('**/news.json*', (r) => r.fulfill({ json: NEWS }));
  await page.route('https://commons.wikimedia.org/**', (r) =>
    r.fulfill({
      json: {
        query: { pages: { '1': { title: 'File:Jimin 2022.jpg', index: 1, imageinfo: [{ thumburl: 'https://upload.wikimedia.org/jimin.png', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Jimin', extmetadata: { Artist: { value: 'Korea.net' }, LicenseShortName: { value: 'CC BY-SA 2.0' } } }] } } },
      },
    }),
  );
  await page.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ body: PNG, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' } }));
});

test('inicio con próximas fechas y noticias; página de noticias con filtros', async ({ page }) => {
  await onboard(page);
  await expect(page.getByRole('region', { name: 'Noticias de BTS' }).getByText('BTS anuncia nuevas fechas de su gira mundial')).toBeVisible();
  await expect(page.getByText('El dólar hoy')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/20-inicio-novedades.png`, fullPage: true });
  await page.getByRole('region', { name: 'Noticias de BTS' }).getByRole('link', { name: 'Ver todas' }).click();
  await expect(page.getByTestId('news')).toHaveCount(2);
  await page.getByRole('button', { name: 'Jimin', exact: true }).click();
  await expect(page.getByTestId('news')).toHaveCount(1);
  await page.screenshot({ path: `${SHOTS}/21-noticias.png`, fullPage: true });
});

test('fechas: lista anual con cumpleaños y archivo de calendario', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/fechas');
  await expect(page.getByTestId('reminder').filter({ hasText: 'Cumpleaños de Jung Kook' })).toBeVisible();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Agregar todo al calendario' }).click();
  const file = await dl;
  expect(file.suggestedFilename()).toBe('seoulmate-fechas.ics');
  await page.screenshot({ path: `${SHOTS}/22-fechas.png`, fullPage: true });
});

test('BTS: discografía, datos de integrantes y galería libre a photocard', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/bts?tab=musica');
  await page.getByRole('button', { name: 'Agregar discografía' }).click();
  await expect(page.getByTestId('album').filter({ hasText: 'Love Yourself: Tear' })).toBeVisible();
  await expect(page.getByTestId('song').filter({ hasText: 'Spring Day' })).toBeVisible();
  await page.getByRole('tab', { name: 'Integrantes' }).click();
  await expect(page.getByTestId('member').filter({ hasText: 'Cumple el 1 sept' })).toBeVisible();
  await page.getByRole('tab', { name: 'Galería' }).click();
  await page.getByRole('button', { name: 'Jimin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Jimin', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('gallery').locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Favorita', exact: true }).first().click();
  await page.getByRole('button', { name: /Mis favoritas \(1\)/ }).click();
  await expect(page.getByTestId('gallery').locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ver foto' }).first().click();
  await page.getByRole('button', { name: 'Crear photocard' }).click();
  await expect(page.getByText(/Photocard creada/)).toBeVisible();
  await page.getByRole('tab', { name: 'Photocards' }).click();
  await expect(page.getByRole('button', { name: /Ver photocard/ })).toHaveCount(1);
});

test('juegos nuevos del gatito: pesca y láser', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/gatito?tab=juegos');
  const adopt = page.getByLabel(/nombre/i).first();
  if (await adopt.isVisible().catch(() => false)) {
    await adopt.fill('Mochi');
    await page.getByRole('button', { name: /Adoptar|Elegir|Listo/ }).first().click();
  }
  await page.goto('/#/gatito?tab=juegos');
  await page.getByRole('button', { name: 'Jugar Pesca del día' }).click();
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  for (let i = 0; i < 10; i++) {
    await page.getByTestId('fish-pull').click();
    await page.waitForTimeout(1000);
  }
  await expect(page.getByTestId('game-result')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/23-pesca.png` });
  await page.getByRole('button', { name: 'Volver' }).click();
  await page.getByRole('button', { name: 'Jugar Puntero láser' }).click();
  await page.getByRole('button', { name: '¡Empezar!' }).click();
  const box = (await page.getByTestId('laser-area').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.65);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/24-laser.png` });
  await expect(page.getByTestId('game-score')).toContainText('s');
});
