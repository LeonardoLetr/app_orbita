import { Injectable, effect, inject, signal } from '@angular/core';
import { STORAGE, readJson, writeJson } from '../utils/storage';

const PREFERENCES_KEY = 'orbita:preferences';

/** Player settings remembered on this device. */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly store = inject(STORAGE);

  /** Whether each category has a countdown. */
  readonly timerEnabled = signal(true);

  constructor() {
    const saved = readJson(this.store, PREFERENCES_KEY) as { timerEnabled?: unknown } | undefined;
    if (typeof saved?.timerEnabled === 'boolean') {
      this.timerEnabled.set(saved.timerEnabled);
    }

    effect(() => writeJson(this.store, PREFERENCES_KEY, { timerEnabled: this.timerEnabled() }));
  }
}
