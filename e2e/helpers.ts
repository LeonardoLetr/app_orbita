import { APIRequestContext, Page, expect } from '@playwright/test';

interface Answer {
  text: string;
  rarity: 'satellite' | 'meteorite' | 'comet' | 'pulsar' | 'supernova';
}

interface Category {
  title: string;
  answers: Answer[];
}

export async function loadCategories(request: APIRequestContext): Promise<Category[]> {
  const response = await request.get('/data/categories.json');
  expect(response.ok()).toBe(true);
  return response.json();
}

/** Answers the category on screen with an answer of the given rarity, or skips it. */
export async function answer(
  page: Page,
  categories: Category[],
  rarity: Answer['rarity'] | 'skip',
): Promise<void> {
  const field = page.locator('#answer[data-ready]');
  await expect(field).toBeVisible();
  const title = (await page.locator('#category-title').innerText()).trim();
  const category = categories.find((c) => c.title === title);
  expect(category, `category "${title}" in the base`).toBeDefined();

  const text = rarity === 'skip' ? '' : category!.answers.find((a) => a.rarity === rarity)!.text;
  await field.fill(text);
  await field.press('Enter');
  // The result appears as a badge next to the rocket.
  await expect(page.locator('app-journey-scene .badge')).toBeVisible();
}
