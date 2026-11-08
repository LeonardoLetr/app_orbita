import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CategoryRepository } from './core/data/category-repository';
import { JsonCategoryRepository } from './core/data/json-category-repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // Swap this implementation to load categories from a backend.
    { provide: CategoryRepository, useClass: JsonCategoryRepository },
  ],
};
