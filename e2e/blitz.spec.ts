import { Page, expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

/** Opens a blitz round from the home screen, straight to the first category. */
async function startBlitz(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: /Relâmpago/ }).click();
  await expect(page).toHaveURL(/\/jogar\/relampago$/);
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('#answer[data-ready]')).toBeVisible();
}

function secondsLeft(page: Page): Promise<number> {
  return page.getByRole('timer').innerText().then(Number);
}

test('plays a blitz round against a single clock', async ({ page, request }) => {
  const categories = await loadCategories(request);
  // The clock of the page is in the hands of the test, which does not wait a whole minute.
  await page.clock.install();
  await startBlitz(page);
  const field = page.locator('#answer');
  const header = page.locator('header');

  await expect(header).toContainText('0 respostas');
  await expect(header).not.toContainText('Categoria');

  await answer(page, categories, 'comet');
  // The keyboard stays open between answers: the field never loses the focus.
  await expect(field).toBeFocused();
  await expect(header).toContainText('1 resposta');

  // Half a minute goes by while the result is on screen, and the clock does not move.
  await page.clock.fastForward(30_000);
  await expect(page.locator('#answer[data-ready]')).toBeVisible();
  expect(await secondsLeft(page)).toBeGreaterThan(50);

  await answer(page, categories, 'supernova');
  await expect(field).toBeFocused();
  await expect(header).toContainText('2 respostas');
  await expect(page.locator('#answer[data-ready]')).toBeVisible();

  // The minute runs out on the third category, with nothing typed.
  await page.clock.fastForward(61_000);
  await expect(page.locator('app-question-card [data-showing="result"]')).toContainText(
    'Tempo esgotado',
  );

  // 50 + 100 points: Mars.
  await expect(page.locator('#result-title')).toHaveText('Marte', { timeout: 15_000 });
  await expect(page.getByText('Modo Relâmpago')).toBeVisible();
  await expect(page.getByText('2 respostas em 60 segundos')).toBeVisible();
  // The categories that were never asked are left out.
  await expect(page.locator('section[aria-labelledby="result-title"] ol > li')).toHaveCount(3);
});

test('keeps the blitz record apart from the classic one', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.clock.install();
  await startBlitz(page);

  await answer(page, categories, 'pulsar');
  await expect(page.locator('#answer[data-ready]')).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.locator('#result-title')).toHaveText('Lua', { timeout: 15_000 });

  await page.getByText('Voltar ao início').click();
  await expect(page.getByRole('link', { name: /Relâmpago/ })).toContainText('Recorde: 75 pts');
  // The big record on the home screen belongs to the classic mode, not played yet.
  await expect(page.locator('#progress-title + dl')).not.toContainText('75');

  await page.getByRole('link', { name: 'Ver histórico' }).click();
  await expect(page.locator('details')).toHaveCount(1);
  await expect(page.locator('details summary')).toContainText('Relâmpago');
  await expect(page.locator('h1 + p')).toContainText('Recorde: Relâmpago 75 pts');
});

test('opens a blitz round from its own address', async ({ page }) => {
  await page.goto('/jogar/relampago');

  await expect(page).toHaveTitle('Relâmpago — Astropalavra');
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('header')).toContainText('0 respostas');
  await expect(page.getByRole('timer')).toHaveText('60');
});
