import { Injectable, effect, inject, signal } from '@angular/core';
import { STORAGE, readJson, writeJson } from '../utils/storage';

const PREFERENCES_KEY = 'orbita:preferences';

interface SavedPreferences {
  timerEnabled?: unknown;
  soundEnabled?: unknown;
}

/** Player settings remembered on this device. */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly store = inject(STORAGE);

  /** Whether each category has a countdown. */
  readonly timerEnabled = signal(true);
  /** Sound effects start off, so a classroom full of phones stays quiet by default. */
  readonly soundEnabled = signal(false);

  constructor() {
    const saved = readJson(this.store, PREFERENCES_KEY) as SavedPreferences | undefined;
    if (typeof saved?.timerEnabled === 'boolean') {
      this.timerEnabled.set(saved.timerEnabled);
    }
    if (typeof saved?.soundEnabled === 'boolean') {
      this.soundEnabled.set(saved.soundEnabled);
    }

    effect(() =>
      writeJson(this.store, PREFERENCES_KEY, {
        timerEnabled: this.timerEnabled(),
        soundEnabled: this.soundEnabled(),
      }),
    );
  }
}
