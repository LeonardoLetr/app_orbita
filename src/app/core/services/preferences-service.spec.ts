import { TestBed } from '@angular/core/testing';
import { KeyValueStore, STORAGE, createMemoryStore } from '../utils/storage';
import { PreferencesService } from './preferences-service';

describe('PreferencesService', () => {
  let store: KeyValueStore;

  beforeEach(() => {
    store = createMemoryStore();
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: store }] });
  });

  it('ignores invalid saved values', () => {
    store.setItem('orbita:preferences', JSON.stringify({ soundEnabled: 'yes' }));

    expect(TestBed.inject(PreferencesService).soundEnabled()).toBe(false);
  });

  it('keeps sound off by default and remembers when it is turned on', () => {
    const preferences = TestBed.inject(PreferencesService);
    expect(preferences.soundEnabled()).toBe(false);

    preferences.soundEnabled.set(true);
    TestBed.tick();

    expect(JSON.parse(store.getItem('orbita:preferences')!).soundEnabled).toBe(true);
  });

  it('restores the saved sound choice', () => {
    store.setItem('orbita:preferences', JSON.stringify({ soundEnabled: true }));

    expect(TestBed.inject(PreferencesService).soundEnabled()).toBe(true);
  });

  it('keeps music off by default and restores the saved choice', () => {
    store.setItem('orbita:preferences', JSON.stringify({ musicEnabled: true }));

    expect(TestBed.inject(PreferencesService).musicEnabled()).toBe(true);
  });
});
