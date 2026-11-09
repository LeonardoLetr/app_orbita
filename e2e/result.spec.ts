import { Page, expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

async function skipRound(page: Page, request: Parameters<typeof loadCategories>[0]) {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  for (let i = 0; i < 7; i++) {
    await answer(page, categories, 'skip');
  }
  await expect(page.locator('#result-title')).toHaveText('Órbita da Terra', { timeout: 15_000 });
}

test('compares the round with the earlier ones', async ({ page, request }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    if (!localStorage.getItem('orbita:progress')) {
      const round = {
        id: 'earlier',
        playedAt: '2026-11-01T15:00:00.000Z',
        points: 100,
        planetId: 'mars',
        timerEnabled: true,
        answers: [],
      };
      localStorage.setItem(
        'orbita:progress',
        JSON.stringify({
          version: 1,
          totalRounds: 1,
          bestPoints: 100,
          reachedPlanets: ['mars'],
          rounds: [round],
        }),
      );
    }
  });

  await skipRound(page, request);

  const chart = page.locator('app-score-history');
  await expect(chart).toContainText('média 50 pts');
  await expect(chart).toContainText('agora');
  await expect(page.getByText('Seu recorde: 100 pts')).toBeVisible();
});

test('copies a summary of the round to share', async ({ page, context, request }) => {
  test.setTimeout(60_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // Use the copy fallback even where the browser offers a share sheet.
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }));

  await skipRound(page, request);
  await page.getByRole('button', { name: 'Compartilhar' }).click();

  await expect(page.getByRole('button', { name: 'Copiado!' })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('cheguei à órbita da Terra com 0 pts');
  expect(text).toContain('⚫'.repeat(7));
});
