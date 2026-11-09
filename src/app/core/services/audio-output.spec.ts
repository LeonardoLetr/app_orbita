import { TestBed } from '@angular/core/testing';
import { createFakeAudioContext } from '../../testing/fake-audio';
import { AUDIO_CONTEXT_FACTORY, AudioOutput } from './audio-output';

describe('AudioOutput', () => {
  it('creates one context and wakes it up', () => {
    const { context } = createFakeAudioContext();
    const factory = vi.fn(() => context);
    TestBed.configureTestingModule({
      providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: factory }],
    });
    const output = TestBed.inject(AudioOutput);

    expect(output.get()).toBe(context);
    expect(output.get()).toBe(context);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalled();
  });

  it('wakes the audio up again on the next tap', () => {
    const { context } = createFakeAudioContext();
    TestBed.configureTestingModule({
      providers: [{ provide: AUDIO_CONTEXT_FACTORY, useValue: () => context }],
    });
    TestBed.inject(AudioOutput).get();
    context.resume.mockClear();

    document.dispatchEvent(new Event('pointerdown'));

    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('gives null when the browser has no Web Audio', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUDIO_CONTEXT_FACTORY,
          useValue: () => {
            throw new Error('no audio');
          },
        },
      ],
    });

    expect(TestBed.inject(AudioOutput).get()).toBeNull();
  });
});
