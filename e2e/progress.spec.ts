import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('saves the round in the history and on the home screen', async ({ page, request }) => {
  test.setTimeout(90_000);
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  // Seven common answers: 70 points, the Moon.
  for (let i = 0; i < 7; i++) {
    await answer(page, categories, 'satellite');
  }
  await expect(page.locator('#result-title')).toHaveText('Lua', { timeout: 15_000 });

  await page.goto('/');
  await expect(page.getByText('Destinos alcançados: 1 de 8')).toBeVisible();
  await page.getByRole('link', { name: 'Ver histórico' }).click();

  await expect(page.locator('details')).toHaveCount(1);
  await expect(page.locator('details')).toContainText('70 pts');
});

test('remembers the timer and sound switches after a reload', async ({ page }) => {
  await page.goto('/');
  const [timer, sound] = await page.getByRole('switch').all();
  await timer.click({ force: true });
  await sound.click({ force: true });

  await page.reload();

  await expect(page.getByRole('switch').first()).not.toBeChecked();
  await expect(page.getByRole('switch').nth(1)).toBeChecked();
});

test('plays without the timer when it is turned off', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch').first().click({ force: true });
  await page.getByRole('link', { name: 'Começar partida' }).click();

  await expect(page.locator('#answer')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveCount(0);
});
