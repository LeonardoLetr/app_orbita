import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Category } from '../models/category';
import { CategoryRepository } from './category-repository';

/** Relative so it resolves against the app base href (e.g. on GitHub Pages). */
export const CATEGORIES_URL = 'data/categories.json';

@Injectable()
export class JsonCategoryRepository extends CategoryRepository {
  private readonly http = inject(HttpClient);
  private categories?: Promise<Category[]>;

  getAll(): Promise<Category[]> {
    this.categories ??= firstValueFrom(this.http.get<Category[]>(CATEGORIES_URL)).catch(
      (error: unknown) => {
        // Allow a retry on the next call instead of caching the failure.
        this.categories = undefined;
        throw error;
      },
    );
    return this.categories;
  }
}
