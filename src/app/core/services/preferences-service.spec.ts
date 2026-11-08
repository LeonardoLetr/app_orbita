import { TestBed } from '@angular/core/testing';
import { KeyValueStore, STORAGE, createMemoryStore } from '../utils/storage';
import { PreferencesService } from './preferences-service';

describe('PreferencesService', () => {
  let store: KeyValueStore;

  beforeEach(() => {
    store = createMemoryStore();
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: store }] });
  });

  it('has the timer on by default', () => {
    expect(TestBed.inject(PreferencesService).timerEnabled()).toBe(true);
  });

  it('saves the timer choice', () => {
    TestBed.inject(PreferencesService).timerEnabled.set(false);
    TestBed.tick();

    expect(JSON.parse(store.getItem('orbita:preferences')!)).toEqual({ timerEnabled: false });
  });

  it('restores the saved timer choice', () => {
    store.setItem('orbita:preferences', JSON.stringify({ timerEnabled: false }));

    expect(TestBed.inject(PreferencesService).timerEnabled()).toBe(false);
  });

  it('ignores invalid saved values', () => {
    store.setItem('orbita:preferences', JSON.stringify({ timerEnabled: 'no' }));

    expect(TestBed.inject(PreferencesService).timerEnabled()).toBe(true);
  });
});
