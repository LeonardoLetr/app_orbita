import { InjectionToken } from '@angular/core';

/** Random source for draws and suggestions. Replace it in tests for predictable results. */
export const RANDOM = new InjectionToken<() => number>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});
