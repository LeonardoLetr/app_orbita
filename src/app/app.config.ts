import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { CategoryRepository } from './core/data/category-repository';
import { JsonCategoryRepository } from './core/data/json-category-repository';
import { LocalProgressRepository } from './core/data/local-progress-repository';
import { ProgressRepository } from './core/data/progress-repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // Swap these implementations to use a backend instead of local files and storage.
    { provide: CategoryRepository, useClass: JsonCategoryRepository },
    { provide: ProgressRepository, useClass: LocalProgressRepository },
    // Keeps the game installable and playable offline; off while developing.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
