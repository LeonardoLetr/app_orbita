import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('plays a survival round until the three lives are gone', async ({ page, request }) => {
  test.setTimeout(60_000);
  const categories = await loadCategories(request);
  await page.goto('/');
  await page.getByRole('link', { name: /Sobrevivência/ }).click();
  await expect(page).toHaveURL(/\/jogar\/sobrevivencia$/);
  await page.getByRole('button', { name: 'Pular decolagem' }).click();

  const header = page.locator('header');
  const lives = header.locator('.life[data-lit]');
  await expect(header).toContainText('Categoria 1');
  await expect(lives).toHaveCount(3);
  // The send button, not the one that skips the launch, which may still be leaving the screen.
  await expect(page.locator('form button[type=submit]')).toContainText('−1 vida');

  // A valid answer keeps the lives.
  await answer(page, categories, 'comet');
  await expect(lives).toHaveCount(3);

  // Each skipped category costs one.
  await answer(page, categories, 'skip');
  await expect(lives).toHaveCount(2);
  await answer(page, categories, 'skip');
  await expect(lives).toHaveCount(1);
  await answer(page, categories, 'skip');
  await expect(lives).toHaveCount(0);

  // 50 points: the Moon.
  await expect(page.locator('#result-title')).toHaveText('Lua', { timeout: 15_000 });
  await expect(page.getByText('Modo Sobrevivência')).toBeVisible();
  await expect(page.getByText('1 resposta antes de perder as 3 vidas')).toBeVisible();
  await expect(page.locator('section[aria-labelledby="result-title"] ol > li')).toHaveCount(4);
});

test('flies past Pluto on the longer route', async ({ page, request }) => {
  test.setTimeout(60_000);
  const categories = await loadCategories(request);
  // The clock of the page is in the hands of the test, to jump over the long flights.
  await page.clock.install();
  await page.goto('/jogar/sobrevivencia');
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('app-journey-scene .stop')).toHaveCount(12);

  // Eight of the rarest answers: 800 points, enough for Eris.
  for (let i = 0; i < 8; i++) {
    await answer(page, categories, 'supernova');
    await page.clock.fastForward(8_000);
  }
  await expect(page.locator('app-question-card')).toContainText('Heliopausa');
  for (let i = 0; i < 3; i++) {
    await answer(page, categories, 'skip');
    await page.clock.fastForward(8_000);
  }

  await expect(page.locator('#result-title')).toHaveText('Éris', { timeout: 15_000 });
  await expect(page.getByText('Faltaram 200 pts para chegar à heliopausa.')).toBeVisible();

  // The classic collection on the home screen only counts the classic stops.
  await page.getByText('Voltar ao início').click();
  await expect(page.getByText('Destinos alcançados: 0 de 8')).toBeVisible();
});
