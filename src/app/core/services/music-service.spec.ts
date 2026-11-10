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

  it('plays faster and busier when time is running out', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.start();
    pass(4);
    const calmStart = sounds();
    pass(4);
    const calm = sounds() - calmStart;

    music.urgent.set(true);
    pass(1);
    const urgentStart = sounds();
    pass(4);
    const urgent = sounds() - urgentStart;

    expect(urgent).toBeGreaterThan(calm * 1.5);
  });

  it('calms down again when there is time', () => {
    TestBed.inject(PreferencesService).musicEnabled.set(true);
    music.urgent.set(true);
    music.start();
    pass(4);
    const urgentStart = sounds();
    pass(4);
    const urgent = sounds() - urgentStart;

    music.urgent.set(false);
    pass(1);
    const calmStart = sounds();
    pass(4);

    expect(sounds() - calmStart).toBeLessThan(urgent / 1.5);
  });
});
