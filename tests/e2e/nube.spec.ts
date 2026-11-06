import { expect, test } from '@playwright/test';

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
  await page.getByLabel('ID de la app de Microsoft').fill('no-es-un-id');
  await page.getByLabel('Enlace de la carpeta compartida').fill('https://ejemplo.com/carpeta');
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Pegá el "Application (client) ID"')).toBeVisible();
  await page.getByLabel('ID de la app de Microsoft').fill('0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b');
  await page.getByLabel('Enlace de la carpeta compartida').fill('https://1drv.ms/f/s!AbCdEfGh');
  await page.getByRole('button', { name: 'Guardar' }).last().click();
  await expect(page.getByText('Nube configurada')).toBeVisible();

  await page.goto('/#/dramas?tab=nube');
  await expect(page.getByRole('button', { name: 'Entrar con Microsoft' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/52-en-la-nube.png' });
});
