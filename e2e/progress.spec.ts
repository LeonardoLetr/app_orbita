import { expect, test } from '@playwright/test';
import { LAUNCH_WAIT, answer, loadCategories } from './helpers';

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

test('remembers the sound switch after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Sons' }).click({ force: true });
  // The choice is saved a moment after the click: reloading before that would lose it.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('orbita:preferences')))
    .toContain('"soundEnabled":true');

  await page.reload();

  await expect(page.getByRole('switch', { name: 'Sons' })).toBeChecked();
});

test('always plays with the timer', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('orbita:preferences', JSON.stringify({ timerEnabled: false })),
  );
  await page.goto('/');
  await page.getByRole('link', { name: 'Começar partida' }).click();

  await expect(page.getByRole('timer')).toBeVisible({ timeout: LAUNCH_WAIT });
});
