import { TestBed } from '@angular/core/testing';
import { createFakeAudioContext } from '../../testing/fake-audio';
import { RANDOM } from '../utils/random';
import { STORAGE, createMemoryStore } from '../utils/storage';
import { AUDIO_CONTEXT_FACTORY } from './audio-output';
import { MusicService } from './music-service';
import { PreferencesService } from './preferences-service';

describe('MusicService', () => {
  let fake: ReturnType<typeof createFakeAudioContext>;
  let music: MusicService;

  beforeEach(() => {
    vi.useFakeTimers();
    fake = createFakeAudioContext();
    TestBed.configureTestingModule({
      providers: [
        { provide: STORAGE, useFactory: createMemoryStore },
        { provide: AUDIO_CONTEXT_FACTORY, useValue: () => fake.context },
        { provide: RANDOM, useValue: () => 0.5 },
      ],
    });
    music = TestBed.inject(MusicService);
  });

  afterEach(() => {
    music.stop();
    vi.useRealTimers();
  });

  it('stays silent while music is off', () => {
    music.start();

    expect(music.playing).toBe(false);
    expect(fake.started.oscillators).toBe(0);
  });

  it('plays a chord and some sparkles when on', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);

    music.start();

    // 4 notes with 2 voices each, plus 3 sparkles.
    expect(music.playing).toBe(true);
    expect(fake.started.oscillators).toBe(11);
  });

  it('keeps going with the next chord', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();

    vi.advanceTimersByTime(8000);

    expect(fake.started.oscillators).toBe(22);
  });

  it('does not start twice', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    music.start();

    expect(fake.started.oscillators).toBe(11);
  });

  it('stops scheduling after stop', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    music.stop();

    vi.advanceTimersByTime(30_000);

    expect(music.playing).toBe(false);
    expect(fake.started.oscillators).toBe(11);
  });
});
