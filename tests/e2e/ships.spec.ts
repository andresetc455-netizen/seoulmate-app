import { expect, test, type Page } from '@playwright/test';

const PASS = 'clave-segura-123';

async function onboard(page: Page) {
  await page.goto('./');
  await page.getByLabel('¿Cómo querés que te llame?').fill('Nicole');
  await page.getByLabel('Creá una contraseña').fill(PASS);
  await page.getByLabel('Repetí la contraseña').fill(PASS);
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Nicole/ })).toBeVisible();
}

test('ships: acciones animadas y apodos con filtro', async ({ page }) => {
  await onboard(page);
  await page.goto('./#/bts?tab=ships');
  await expect(page.getByRole('heading', { name: /Jikook/ })).toBeVisible();
  await expect(page.getByText('Hadita tucumana').first()).toBeVisible();
  await page.getByRole('button', { name: /Beso$/ }).click();
  await expect(page.getByText(/se dan un beso|roba un beso|besó a/)).toBeVisible();
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: 'docs/screenshots/35-ships-beso.png' });
  await page.getByRole('radiogroup', { name: 'Primero' }).getByRole('radio', { name: 'V' }).click();
  await page.getByRole('button', { name: /Bajo la lluvia/ }).click();
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/screenshots/36-ships-lluvia.png' });

  await page.getByRole('button', { name: 'Editar' }).click();
  const jk = page.getByPlaceholder('Jung Kook');
  await jk.fill('mi amor');
  await page.getByRole('button', { name: 'Guardar apodos' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Error (Andrés es tu novio)' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/37-ships-apodo-bloqueado.png' });
  await jk.fill('Kookie');
  await page.getByRole('button', { name: 'Guardar apodos' }).click();
  await expect(page.getByText('Kookie').first()).toBeVisible();
});
