import { expect, test } from '@playwright/test';

// Las respuestas simuladas de Google no pasan por el service worker: se prueba el camino directo.
test.use({ serviceWorkers: 'block' });

test('En la nube: sin configurar avisa; con OneDrive configurado pide entrar con Microsoft', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill('clave-secreta');
  await page.getByLabel('Repetí la contraseña').fill('clave-secreta');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Dramas' }).click();
  await page.getByRole('tab', { name: 'En la nube' }).click();
  await expect(page.getByText('Todavía no hay una carpeta conectada')).toBeVisible();

  await page.goto('/#/ajustes');
  await page.getByLabel('ID de la app (Microsoft o Google)').fill('no-es-un-id');
  await page.getByLabel('Enlace de la carpeta compartida').fill('https://ejemplo.com/carpeta');
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Pegá el ID de la app')).toBeVisible();
  await page.getByLabel('ID de la app (Microsoft o Google)').fill('0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b');
  await page.getByLabel('Enlace de la carpeta compartida').fill('https://1drv.ms/f/s!AbCdEfGh');
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Nube configurada')).toBeVisible();

  await page.goto('/#/dramas?tab=nube');
  await expect(page.getByRole('button', { name: 'Entrar con Microsoft' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/52-en-la-nube.png' });
});

test('En la nube sin app registrada: botón para abrir la carpeta en OneDrive', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill('clave-secreta');
  await page.getByLabel('Repetí la contraseña').fill('clave-secreta');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  await page.goto('/#/ajustes');
  await page.getByLabel('Enlace de la carpeta compartida').fill('https://1drv.ms/f/c/abc123/CarpetaDePrueba');
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Nube configurada')).toBeVisible();
  await page.goto('/#/dramas?tab=nube');
  const open = page.getByRole('link', { name: 'Ver capítulos en OneDrive' });
  await expect(open).toHaveAttribute('href', 'https://1drv.ms/f/c/abc123/CarpetaDePrueba');
  await page.screenshot({ path: 'docs/screenshots/53-abrir-onedrive.png' });
});

test('En la nube con Google Drive: entrar, ver dramas de la carpeta y reproducir dentro de la app', async ({ page }) => {
  const FOLDER = 'https://drive.google.com/drive/folders/1RaizDePruebaSeoulmate?usp=sharing';
  // Inicio de sesión de Google simulado.
  await page.route('https://accounts.google.com/gsi/client', (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: `window.google = { accounts: { oauth2: { initTokenClient: (c) => ({ requestAccessToken: () => setTimeout(() => c.callback({ access_token: 'tok', expires_in: 3600 }), 50) }) } } };`,
    }),
  );
  // Carpeta: Goblin con dos capítulos y un subtítulo.
  await page.route('https://www.googleapis.com/drive/v3/files?**', (r) => {
    const q = new URL(r.request().url()).searchParams.get('q') ?? '';
    const files = q.includes('1RaizDePruebaSeoulmate')
      ? [{ id: 'goblin', name: 'Goblin (2016)', mimeType: 'application/vnd.google-apps.folder' }]
      : q.includes("'goblin'")
        ? [
            { id: 'e2', name: 'Goblin S01E02.webm', mimeType: 'video/webm', size: '2490', videoMediaMetadata: { durationMillis: '3000' } },
            { id: 'e1', name: 'Goblin S01E01.webm', mimeType: 'video/webm', size: '2496', videoMediaMetadata: { durationMillis: '3000' } },
            { id: 's1', name: 'Goblin S01E01.srt', mimeType: 'application/x-subrip' },
          ]
        : [];
    return r.fulfill({ json: { files } });
  });
  await page.route('https://www.googleapis.com/drive/v3/files/*?alt=media**', (r) => {
    const id = new URL(r.request().url()).pathname.split('/').pop();
    const file = id === 's1' ? 'tests/fixtures/Goblin.S01E01.srt' : id === 'e1' ? 'tests/fixtures/Goblin.S01E01.webm' : 'tests/fixtures/Goblin.S01E02.webm';
    return r.fulfill({ path: file, headers: { 'access-control-allow-origin': '*' }, contentType: id === 's1' ? 'text/plain' : 'video/webm' });
  });

  await page.goto('/');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill('clave-secreta');
  await page.getByLabel('Repetí la contraseña').fill('clave-secreta');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  await page.goto('/#/ajustes');
  await page.getByLabel('ID de la app (Microsoft o Google)').fill('123-abc.apps.googleusercontent.com');
  await page.getByLabel('Enlace de la carpeta compartida').fill(FOLDER);
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Nube configurada')).toBeVisible();

  await page.goto('/#/dramas?tab=nube');
  await page.getByRole('button', { name: 'Entrar con Google' }).click();
  const show = page.getByTestId('cloud-show');
  await expect(show).toHaveCount(1);
  await expect(show).toContainText('Goblin');
  await show.getByRole('button', { name: /Goblin/ }).click();
  await expect(page.getByTestId('cloud-episode')).toHaveCount(2);
  await expect(page.getByTestId('cloud-episode').first()).toContainText('Capítulo 1');
  await page.screenshot({ path: 'docs/screenshots/54-nube-google.png' });
  await page.getByTestId('cloud-episode').first().click();
  await expect(page.locator('.video-name')).toHaveText('Capítulo 1');
  await expect(page.getByTestId('local-video').locator('track')).toHaveCount(1);
  await expect(page.locator('.video-name')).toHaveText('Capítulo 2', { timeout: 15_000 });
  await page.getByRole('button', { name: '✕ Cerrar' }).click();
  // El drama aparece en "Mis dramas" con el progreso.
  await page.getByRole('tab', { name: 'Mis dramas' }).click();
  await expect(page.getByTestId('drama').filter({ hasText: 'Goblin' })).toBeVisible();
});
