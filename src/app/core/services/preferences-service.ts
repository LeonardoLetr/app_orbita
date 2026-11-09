import { Injectable, effect, inject, signal } from '@angular/core';
import { STORAGE, readJson, writeJson } from '../utils/storage';

const PREFERENCES_KEY = 'orbita:preferences';

interface SavedPreferences {
  soundEnabled?: unknown;
  musicEnabled?: unknown;
}

/** Player settings remembered on this device. */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly store = inject(STORAGE);

  /** Sound effects start off, so a classroom full of phones stays quiet by default. */
  readonly soundEnabled = signal(false);
  /** Background music, also off by default. */
  readonly musicEnabled = signal(false);

  constructor() {
    const saved = readJson(this.store, PREFERENCES_KEY) as SavedPreferences | undefined;
    if (typeof saved?.soundEnabled === 'boolean') {
      this.soundEnabled.set(saved.soundEnabled);
    }
    if (typeof saved?.musicEnabled === 'boolean') {
      this.musicEnabled.set(saved.musicEnabled);
    }

    effect(() =>
      writeJson(this.store, PREFERENCES_KEY, {
        soundEnabled: this.soundEnabled(),
        musicEnabled: this.musicEnabled(),
      }),
    );
  }
}
