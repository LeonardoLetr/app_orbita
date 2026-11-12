import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('keeps the answers that scored in the logbook, without showing the others', async ({
  page,
  request,
}) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('#answer[data-ready]')).toBeVisible();

  const title = (await page.locator('#category-title').innerText()).trim();
  const category = categories.find((item) => item.title === title)!;
  const given = category.answers.find((item) => item.rarity === 'comet')!;
  const notGiven = category.answers.find(
    (item) => item.rarity === 'comet' && item.text !== given.text,
  )!;
  await answer(page, categories, 'comet');
  for (let i = 0; i < 6; i++) {
    await answer(page, categories, 'skip');
  }

  await expect(page.locator('#result-title')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Nova descoberta!')).toHaveCount(1);
  await page.getByRole('link', { name: '1 resposta nova no diário de bordo' }).click();

  await expect(page).toHaveURL(/\/diario$/);
  await expect(page.locator('main')).toContainText('1 de');
  await page.getByRole('link', { name: new RegExp(title.replace(/[()]/g, '\\$&')) }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.locator('main')).toContainText(given.text);
  await expect(page.locator('main')).not.toContainText(notGiven.text);
  await expect(page.locator('#comet')).toContainText('1 de');

  // The home screen counts the discoveries too.
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Diário de bordo (1)' })).toBeVisible();
});
