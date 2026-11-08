import { InjectionToken } from '@angular/core';

/** The part of the Web Storage API the app needs. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Keeps data only while the page is open, for browsers that block localStorage. */
export function createMemoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** Where player data is kept: localStorage when available, memory otherwise. */
export const STORAGE = new InjectionToken<KeyValueStore>('STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      const storage = globalThis.localStorage;
      storage.setItem('orbita:probe', '1');
      storage.removeItem('orbita:probe');
      return storage;
    } catch {
      return createMemoryStore();
    }
  },
});

/** Reads a JSON value, or undefined when it is missing or unreadable. */
export function readJson(store: KeyValueStore, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Writes a JSON value, ignoring failures such as a full storage. */
export function writeJson(store: KeyValueStore, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing useful to do: the game keeps working without saving.
  }
}
