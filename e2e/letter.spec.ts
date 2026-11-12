import { expect, test } from '@playwright/test';
import { loadCategories } from './helpers';

/** Without accents and in lower case, as the game compares first letters. */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

test('plays a round where every answer begins with the drawn letter', async ({ page, request }) => {
  const categories = await loadCategories(request);
  await page.goto('/');
  await page.getByRole('link', { name: /Letra sorteada/ }).click();
  await expect(page).toHaveURL(/\/jogar\/letra$/);
  await page.getByRole('button', { name: 'Pular decolagem' }).click();

  const field = page.locator('#answer[data-ready]');
  await expect(field).toBeVisible();
  const letter = (await page.locator('app-question-card .seal-letter').innerText()).trim();
  expect(letter).toMatch(/^[A-Z]$/);

  const title = (await page.locator('#category-title').innerText()).trim();
  const answers = categories.find((category) => category.title === title)!.answers;
  const withLetter = answers.filter((answer) => plain(answer.text).startsWith(plain(letter)));
  const other = answers.find((answer) => !plain(answer.text).startsWith(plain(letter)))!;
  // Every category drawn has enough answers with the letter.
  expect(withLetter.length).toBeGreaterThanOrEqual(5);

  // An answer of the base with another letter does not score and does not use the turn.
  await field.fill(other.text);
  await field.press('Enter');
  await expect(page.locator('#retry-message')).toHaveText(
    `Essa existe, mas precisa começar com ${letter}!`,
  );
  await expect(page.locator('app-question-card [data-showing="question"]')).toHaveCount(1);

  await field.fill(withLetter[0].text);
  await field.press('Enter');
  await expect(page.locator('app-question-card [data-showing="result"]')).toHaveCount(1);
  await expect(page.locator('header')).not.toContainText(' 0pts');
});

test('opens a round with a letter from its own address', async ({ page }) => {
  await page.goto('/jogar/letra');

  await expect(page).toHaveTitle('Letra sorteada — Astropalavra');
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('app-question-card .seal-letter')).toBeVisible();
});
