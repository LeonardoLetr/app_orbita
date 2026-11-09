/** A minimal stand-in for the Web Audio API, recording what was created and started. */
export function createFakeAudioContext() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  });
  const node = <T extends object>(extra: T) => ({
    ...extra,
    connect: vi.fn((target: unknown) => target),
    disconnect: vi.fn(),
  });

  const started = { oscillators: 0, noises: 0 };
  const context = {
    state: 'suspended' as AudioContextState,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() =>
      node({
        type: 'sine',
        frequency: param(),
        detune: param(),
        start: vi.fn(() => started.oscillators++),
        stop: vi.fn(),
      }),
    ),
    createGain: vi.fn(() => node({ gain: param() })),
    createBiquadFilter: vi.fn(() => node({ type: 'lowpass', frequency: param(), Q: param() })),
    createDelay: vi.fn(() => node({ delayTime: param() })),
    createBuffer: vi.fn((channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() =>
      node({ buffer: null, loop: false, start: vi.fn(() => started.noises++), stop: vi.fn() }),
    ),
  };
  return { context: context as unknown as AudioContext & typeof context, started };
}
