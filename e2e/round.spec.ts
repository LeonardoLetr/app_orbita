import { Page, expect, test } from '@playwright/test';
import { LAUNCH_WAIT, answer, loadCategories } from './helpers';

async function barBottom(page: Page): Promise<number> {
  const bar = (await page.locator('form').boundingBox())!;
  return Math.round(bar.y + bar.height);
}

test('plays a full round and reaches the planet for the score', async ({ page, request }) => {
  test.setTimeout(90_000);
  const categories = await loadCategories(request);
  await page.goto('/');
  await page.getByRole('link', { name: 'Começar partida' }).click();

  // 100 + 50 + 0 + 75 + 25 + 10 + 75 = 335 points: Saturn, 35 short of Uranus.
  const plan = [
    'supernova',
    'comet',
    'skip',
    'pulsar',
    'meteorite',
    'satellite',
    'pulsar',
  ] as const;
  for (const rarity of plan) {
    await answer(page, categories, rarity);
  }

  await expect(page.locator('#result-title')).toHaveText('Saturno', { timeout: 15_000 });
  await expect(page.getByText('Faltaram 35 pts para chegar a Urano.')).toBeVisible();
  await expect(page.locator('#result-title')).toBeFocused();
});

test('keeps the same answer field for every category', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  const field = page.locator('#answer');
  await expect(field).toBeFocused({ timeout: LAUNCH_WAIT });
  const first = await field.elementHandle();

  await answer(page, categories, 'satellite');
  // The keyboard goes away during the flight and comes back with the next category.
  await expect(field).not.toBeFocused();
  await expect(page.getByText('Categoria 2 de 7')).toBeVisible({ timeout: 5_000 });

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

  // The bar slides in after the launch, then rests on the keyboard.
  await expect.poll(() => barBottom(page)).toBe(460);
  const bar = (await page.locator('form').boundingBox())!;
  const card = page.locator('app-question-card [data-showing="result"]');
  const box = (await card.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(bar.y);
  await expect(card).toContainText('Cometa');
});

test('shows the result above the keyboard on an iPhone', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  await expect(page.locator('#answer[data-ready]')).toBeVisible({ timeout: LAUNCH_WAIT });

  // Safari keeps the page size and only shrinks the visible part above the keyboard.
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, 'height', { configurable: true, get: () => 380 });
    viewport.dispatchEvent(new Event('resize'));
  });
  await answer(page, categories, 'comet');

  await expect.poll(() => barBottom(page)).toBe(380);
  const bar = (await page.locator('form').boundingBox())!;
  const box = (await page.locator('app-question-card [data-showing="result"]').boundingBox())!;
  expect(box.y + box.height).toBeLessThan(bar.y);
});

test('stays in place when the answer field is focused while it slides in', async ({ page }) => {
  await page.goto('/jogar');
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('#answer[data-ready]')).toBeVisible();

  // The keyboard opens and the field is focused again while the bar is still coming up from
  // below the screen. A browser scrolls to show a focused field, even inside the round.
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, 'height', { configurable: true, get: () => 380 });
    viewport.dispatchEvent(new Event('resize'));
    const field = document.querySelector<HTMLInputElement>('#answer')!;
    field.blur();
    field.focus();
  });

  await expect.poll(() => barBottom(page)).toBe(380);
  expect((await page.locator('header').boundingBox())!.y).toBe(0);
});

test('takes off from the ground before the first category', async ({ page }) => {
  await page.goto('/jogar');

  await expect(page.locator('app-launch-layers .pad')).toBeVisible();
  await expect(page.locator('.launch-countdown')).toContainText('3');
  await expect(page.locator('#answer[data-ready]')).toHaveCount(0);

  await expect(page.locator('#answer[data-ready]')).toBeVisible({ timeout: LAUNCH_WAIT });
  await expect(page.locator('app-launch-layers')).toHaveCount(0);
  await expect(page.locator('#category-title')).toBeVisible();
});

test('can skip the launch', async ({ page }) => {
  await page.goto('/jogar');

  await page.getByRole('button', { name: 'Pular decolagem' }).click();

  await expect(page.locator('#answer[data-ready]')).toBeVisible({ timeout: 1_000 });
  await expect(page.locator('#answer')).toBeFocused();
});
