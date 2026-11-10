import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('moves up a rank when a round brings enough experience', async ({ page, request }) => {
  const categories = await loadCategories(request);
  // A cadet 50 points away from becoming a pilot.
  await page.addInitScript(() => {
    if (!localStorage.getItem('orbita:progress')) {
      localStorage.setItem(
        'orbita:progress',
        JSON.stringify({ version: 2, rounds: [], totalRounds: 4, bestByMode: {}, xp: 450 }),
      );
    }
  });
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('section[aria-labelledby="progress-title"]')).toContainText(
    '450 XP · faltam 50 para Piloto',
  );

  await page.getByRole('link', { name: /Relâmpago/ }).click();
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await answer(page, categories, 'pulsar');
  await expect(page.locator('#answer[data-ready]')).toBeVisible();
  await page.clock.fastForward(61_000);

  const career = page.locator('section[aria-labelledby="career-title"]');
  await expect(career).toContainText('Nova patente: Piloto!', { timeout: 15_000 });
  await expect(career).toContainText('+75 XP');

  await page.getByText('Voltar ao início').click();
  const card = page.locator('section[aria-labelledby="progress-title"]');
  await expect(card).toContainText('Piloto');
  await expect(card).toContainText('525 XP · faltam 975 para Navegador');
});
