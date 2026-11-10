import { expect, test } from '@playwright/test';
import { answer } from './helpers';

test('plays a round with categories of the chosen theme only', async ({ page, request }) => {
  test.setTimeout(60_000);
  const response = await request.get('/data/categories.json');
  const categories: { title: string; themes: string[]; answers: never[] }[] = await response.json();

  await page.goto('/');
  await page.getByRole('link', { name: /Por tema/ }).click();
  await expect(page.getByRole('heading', { name: 'Escolha um tema' })).toBeVisible();
  await expect(page.locator('ul a')).toHaveCount(6);

  await page.getByRole('link', { name: /Mundo/ }).click();
  await expect(page).toHaveURL(/\/jogar\/tema\/mundo$/);
  await page.getByRole('button', { name: 'Pular decolagem' }).click();
  await expect(page.locator('header')).toContainText('Mundo');

  for (let i = 0; i < 7; i++) {
    await expect(page.locator('#answer[data-ready]')).toBeVisible();
    const title = (await page.locator('#category-title').innerText()).trim();
    expect(categories.find((category) => category.title === title)?.themes, title).toContain(
      'world',
    );
    await answer(page, categories, 'skip');
  }

  await expect(page.locator('#result-title')).toHaveText('Órbita da Terra', { timeout: 15_000 });
  await expect(page.getByText('Tema Mundo')).toBeVisible();

  await page.getByRole('link', { name: 'Escolher outro tema' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha um tema' })).toBeVisible();

  await page.goto('/historico');
  await expect(page.locator('details summary')).toContainText('Tema Mundo');
});
