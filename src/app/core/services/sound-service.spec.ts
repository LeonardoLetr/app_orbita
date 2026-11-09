import { TestBed } from '@angular/core/testing';
import { STORAGE, createMemoryStore } from '../utils/storage';
import { PreferencesService } from './preferences-service';
import { createFakeAudioContext } from '../../testing/fake-audio';
import { AUDIO_CONTEXT_FACTORY } from './audio-output';
import { SoundService } from './sound-service';

describe('SoundService', () => {
  let fake: ReturnType<typeof createFakeAudioContext>;
  let factory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fake = createFakeAudioContext();
    factory = vi.fn(() => fake.context);
    TestBed.configureTestingModule({
      providers: [
        { provide: STORAGE, useFactory: createMemoryStore },
        { provide: AUDIO_CONTEXT_FACTORY, useValue: factory },
      ],
    });
  });

  it('stays silent while sound is off', () => {
    TestBed.inject(SoundService).play('supernova');

    expect(factory).not.toHaveBeenCalled();
  });

  it('plays the notes of an effect when sound is on', () => {
    TestBed.inject(PreferencesService).soundEnabled.set(true);

    TestBed.inject(SoundService).play('supernova');

    expect(fake.started.oscillators).toBe(4);
    expect(fake.context.resume).toHaveBeenCalled();
  });

  it('reuses the same audio context', () => {
    TestBed.inject(PreferencesService).soundEnabled.set(true);
    const sound = TestBed.inject(SoundService);

    sound.play('satellite');
    sound.play('comet');

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the browser has no Web Audio', () => {
    TestBed.overrideProvider(AUDIO_CONTEXT_FACTORY, { useValue: () => null });
    TestBed.inject(PreferencesService).soundEnabled.set(true);

    expect(() => TestBed.inject(SoundService).play('miss')).not.toThrow();
  });

  it('plays the engine as filtered noise', () => {
    TestBed.inject(PreferencesService).soundEnabled.set(true);

    TestBed.inject(SoundService).play('thrust', 2);

    expect(fake.started.noises).toBe(1);
    expect(fake.context.createBiquadFilter).toHaveBeenCalled();
  });
});
