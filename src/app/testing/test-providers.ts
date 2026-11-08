import { Provider } from '@angular/core';
import { LocalProgressRepository } from '../core/data/local-progress-repository';
import { ProgressRepository } from '../core/data/progress-repository';
import { STORAGE, createMemoryStore } from '../core/utils/storage';

/** Real progress storage, kept in memory so tests do not share saved data. */
export function provideTestProgress(): Provider[] {
  return [
    { provide: STORAGE, useFactory: createMemoryStore },
    { provide: ProgressRepository, useClass: LocalProgressRepository },
  ];
}
