import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('plays a full round and reaches the planet for the score', async ({ page, request }) => {
  test.setTimeout(60_000);
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

test('keeps the answer bar on top of the keyboard', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  const { width } = page.viewportSize()!;

  // A phone keyboard leaves only the top part of the screen visible.
  await page.setViewportSize({ width, height: 460 });
  await answer(page, categories, 'comet');

  const bar = (await page.locator('form').boundingBox())!;
  const badge = (await page.locator('app-journey-scene .badge').boundingBox())!;
  expect(Math.round(bar.y + bar.height)).toBe(460);
  expect(badge.y + badge.height).toBeLessThan(bar.y);
  await expect(page.locator('app-journey-scene .badge')).toContainText('Cometa +20');
});
