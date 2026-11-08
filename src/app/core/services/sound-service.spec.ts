import { TestBed } from '@angular/core/testing';
import { STORAGE, createMemoryStore } from '../utils/storage';
import { PreferencesService } from './preferences-service';
import { AUDIO_CONTEXT_FACTORY, SoundService } from './sound-service';

function fakeAudioContext() {
  const param = () => ({
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const oscillators: { start: ReturnType<typeof vi.fn> }[] = [];
  const context = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => {
      const oscillator = {
        type: 'sine',
        frequency: param(),
        connect: vi.fn((node: unknown) => node),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    }),
    createGain: vi.fn(() => ({ gain: param(), connect: vi.fn((node: unknown) => node) })),
  };
  return { context, oscillators };
}

describe('SoundService', () => {
  let fake: ReturnType<typeof fakeAudioContext>;
  let factory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fake = fakeAudioContext();
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

    expect(fake.oscillators).toHaveLength(4);
    expect(fake.oscillators[0].start).toHaveBeenCalled();
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
});
