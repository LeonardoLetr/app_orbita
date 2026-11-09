import { expect, test } from '@playwright/test';
import { answer, loadCategories } from './helpers';

test('asks to try again for an answer that is not in the base', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  const field = page.locator('#answer');

  await field.fill('palavra inventada');
  await field.press('Enter');

  await expect(page.locator('#retry-message')).toContainText(/Tente|Tenta/);
  await expect(field).toHaveValue('palavra inventada');
  await expect(page.getByText('Categoria 1 de 7')).toBeVisible();

  // The category is still open, so a valid answer counts.
  await answer(page, categories, 'satellite');
  await expect(page.locator('#retry-message')).toHaveText('');
});

test('accepts an answer with one wrong letter and shows the right spelling', async ({
  page,
  request,
}) => {
  const categories = await loadCategories(request);
  await page.goto('/jogar');
  const field = page.locator('#answer[data-ready]');
  await expect(field).toBeVisible();
  const title = (await page.locator('#category-title').innerText()).trim();
  const category = categories.find((c) => c.title === title)!;
  const target = category.answers.find((a) => a.text.length >= 6 && !a.text.includes(' '))!;

  // Swap two letters in the middle, as a quick typist would.
  const middle = Math.floor(target.text.length / 2);
  const chars = [...target.text];
  [chars[middle - 1], chars[middle]] = [chars[middle], chars[middle - 1]];
  await field.fill(chars.join(''));
  await field.press('Enter');

  await expect(page.locator('app-question-card [data-showing="result"]')).toHaveCount(1);
  await expect(page.locator('app-question-card .back-note')).toContainText(target.text);
});
