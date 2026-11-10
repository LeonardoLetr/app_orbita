import { TestBed } from '@angular/core/testing';
import { createFakeAudioContext } from '../../testing/fake-audio';
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
      ],
    });
    music = TestBed.inject(MusicService);
  });

  afterEach(() => {
    music.stop();
    vi.useRealTimers();
  });

  /** Lets time go by on the clock of the page and on the clock of the audio together. */
  function pass(seconds: number) {
    for (let i = 0; i < seconds * 20; i++) {
      (fake.context as { currentTime: number }).currentTime += 0.05;
      vi.advanceTimersByTime(50);
    }
  }

  const sounds = () => fake.started.oscillators + fake.started.noises;

  it('stays silent while music is off', () => {
    music.start();

    expect(music.playing).toBe(false);
    expect(sounds()).toBe(0);
  });

  it('plays the tune, with bass and drums, when on', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);

    music.start();

    expect(music.playing).toBe(true);
    expect(fake.started.oscillators).toBeGreaterThan(3);
  });

  it('keeps going, bar after bar', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    const first = sounds();

    pass(4);
    const afterFour = sounds();
    pass(4);

    expect(afterFour).toBeGreaterThan(first * 4);
    expect(fake.started.noises).toBeGreaterThan(0);
    expect(sounds() - afterFour).toBeGreaterThan(first * 4);
  });

  it('does not start twice', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    const first = sounds();
    music.start();

    expect(sounds()).toBe(first);
  });

  it('stops scheduling after stop', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    music.stop();
    const stopped = sounds();

    pass(10);

    expect(music.playing).toBe(false);
    expect(sounds()).toBe(stopped);
  });

  /** Sounds started while the given seconds go by. */
  function count(seconds: number): number {
    const before = sounds();
    pass(seconds);
    return sounds() - before;
  }

  it('plays faster and busier when time is running out', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    pass(4);
    const calm = count(4);

    music.urgency.set(1);
    pass(6);

    expect(count(4)).toBeGreaterThan(calm * 1.5);
  });

  it('speeds up little by little, never all at once', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    pass(4);
    const calm = count(2);

    music.urgency.set(1);
    const justAfter = count(2);
    pass(4);
    const later = count(2);

    expect(justAfter).toBeGreaterThanOrEqual(calm);
    expect(justAfter).toBeLessThan(later);
  });

  it('follows the urgency part of the way when there is still some time', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    pass(4);
    const calm = count(4);

    music.urgency.set(0.3);
    pass(6);
    const some = count(4);
    music.urgency.set(1);
    pass(6);
    const full = count(4);

    expect(some).toBeGreaterThan(calm);
    expect(some).toBeLessThan(full);
  });

  it('calms down again when there is time', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.urgency.set(1);
    music.start();
    pass(8);
    const urgent = count(4);

    music.urgency.set(0);
    pass(6);

    expect(count(4)).toBeLessThan(urgent / 1.5);
  });
});
