import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('plays a full round and reaches the planet for the score', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/');
  await page.getByRole('link', { name: 'Começar partida' }).click();

  // 30 + 20 + 0 + 20 + 30 = 100 points: Uranus.
  for (const rarity of ['supernova', 'comet', 'unknown', 'comet', 'supernova'] as const) {
    await answer(page, categories, rarity);
  }

  await expect(page.locator('#result-title')).toHaveText('Urano', { timeout: 15_000 });
  await expect(page.getByText('Faltaram 20 pts para chegar a Netuno.')).toBeVisible();
  await expect(page.locator('#result-title')).toBeFocused();
});

test('keeps the same answer field for every category', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  const field = page.locator('#answer');
  await expect(field).toBeFocused();
  const first = await field.elementHandle();

  await answer(page, categories, 'satellite');
  await expect(page.getByText('Categoria 2 de 5')).toBeVisible({ timeout: 5_000 });

  await expect(field).toBeFocused();
  expect(await page.evaluate((el) => el === document.querySelector('#answer'), first)).toBe(true);
});

test('shows the answer score above the keyboard area', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');

  await answer(page, categories, 'comet');

  const reveal = await page.locator('app-answer-reveal').boundingBox();
  const viewport = page.viewportSize()!;
  // Phone keyboards cover roughly the lower 45% of the screen.
  expect(reveal!.y + reveal!.height).toBeLessThan(viewport.height * 0.55);
  await expect(page.locator('app-answer-reveal')).toContainText('Cometa!');
});
