import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Category } from '../models/category';
import { CATEGORIES_URL, JsonCategoryRepository } from './json-category-repository';

describe('JsonCategoryRepository', () => {
  const categories: Category[] = [
    { id: 'fruit', title: 'Fruta', answers: [{ text: 'Banana', rarity: 'satellite' }] },
  ];

  let repository: JsonCategoryRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JsonCategoryRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(JsonCategoryRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads categories from the json file', async () => {
    const result = repository.getAll();
    http.expectOne(CATEGORIES_URL).flush(categories);

    expect(await result).toEqual(categories);
  });

  it('fetches the file only once', async () => {
    const first = repository.getAll();
    const second = repository.getAll();
    http.expectOne(CATEGORIES_URL).flush(categories);

    expect(await first).toBe(await second);
  });

  it('retries after a failed request', async () => {
    const failed = repository.getAll();
    http.expectOne(CATEGORIES_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await expect(failed).rejects.toBeTruthy();

    const retried = repository.getAll();
    http.expectOne(CATEGORIES_URL).flush(categories);
    expect(await retried).toEqual(categories);
  });
});
