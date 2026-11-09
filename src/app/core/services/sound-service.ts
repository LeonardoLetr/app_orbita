import { Injectable, inject } from '@angular/core';
import { Rarity } from '../models/rarity';
import { AudioOutput } from './audio-output';
import { PreferencesService } from './preferences-service';

export type SoundEffect = Rarity | 'miss' | 'liftoff' | 'arrive' | 'finish' | 'thrust' | 'deal';

interface Note {
  /** Frequency in Hz; a pair slides from the first to the second. */
  freq: number | [number, number];
  /** Start, in seconds after the effect begins. */
  at: number;
  length: number;
  wave?: OscillatorType;
  volume?: number;
}

/** Short synthesized effects, so the game ships no audio files. */
const EFFECTS: Record<SoundEffect, Note[]> = {
  satellite: [{ freq: 660, at: 0, length: 0.18, wave: 'triangle' }],
  meteorite: [
    { freq: 587, at: 0, length: 0.12, wave: 'triangle' },
    { freq: 784, at: 0.1, length: 0.2, wave: 'triangle' },
  ],
  comet: [
    { freq: 660, at: 0, length: 0.12, wave: 'triangle' },
    { freq: 880, at: 0.1, length: 0.12, wave: 'triangle' },
    { freq: 990, at: 0.2, length: 0.24, wave: 'triangle' },
  ],
  // A pulsar blinks: quick repeated beeps.
  pulsar: [0, 0.07, 0.14, 0.21].map((at, i) => ({
    freq: i === 3 ? 1319 : 1047,
    at,
    length: i === 3 ? 0.3 : 0.05,
    wave: 'square' as const,
    volume: 0.06,
  })),
  supernova: [523, 659, 784, 1047].map((freq, i) => ({
    freq,
    at: i * 0.08,
    length: i === 3 ? 0.4 : 0.14,
    wave: 'triangle' as const,
  })),
  miss: [{ freq: [240, 140], at: 0, length: 0.35, wave: 'square', volume: 0.05 }],
  liftoff: [{ freq: [160, 620], at: 0, length: 0.7, wave: 'sawtooth', volume: 0.04 }],
  arrive: [
    { freq: 1047, at: 0, length: 0.3, wave: 'sine' },
    { freq: 1319, at: 0.09, length: 0.4, wave: 'sine' },
  ],
  // Engine noise, see playThrust.
  thrust: [],
  // A card swishing in, see playSwoosh.
  deal: [],
  finish: [392, 523, 659, 784, 1047].map((freq, i) => ({
    freq,
    at: i * 0.11,
    length: i === 4 ? 0.6 : 0.16,
    wave: 'triangle' as const,
  })),
};

/** Plays sound effects when the player turned sound on. */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly preferences = inject(PreferencesService);
  private readonly output = inject(AudioOutput);
  private noise?: AudioBuffer;

  readonly enabled = this.preferences.soundEnabled;

  /** Plays an effect; `seconds` sets how long the engine thrust lasts. */
  play(effect: SoundEffect, seconds = 1.2): void {
    if (!this.enabled()) {
      return;
    }
    const context = this.output.get();
    if (!context) {
      return;
    }
    const start = context.currentTime;
    if (effect === 'thrust') {
      this.playThrust(context, start, seconds);
      return;
    }
    if (effect === 'deal') {
      this.playSwoosh(context, start);
      return;
    }
    for (const note of EFFECTS[effect]) {
      this.playNote(context, note, start);
    }
  }

  /** Rocket engine: filtered noise that swells and fades over the flight. */
  private playThrust(context: AudioContext, start: number, seconds: number): void {
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer(context);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(260, start);
    filter.frequency.exponentialRampToValueAtTime(900, start + seconds * 0.3);
    filter.frequency.exponentialRampToValueAtTime(220, start + seconds);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);

    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + seconds + 0.05);
  }

  /** Quick swish of air, as a new card slides in. */
  private playSwoosh(context: AudioContext, start: number): void {
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer(context);

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(500, start);
    filter.frequency.exponentialRampToValueAtTime(2600, start + 0.22);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);

    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + 0.26);
  }

  private noiseBuffer(context: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = this.noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.random() * 2 - 1;
      }
    }
    return this.noise;
  }

  private playNote(context: AudioContext, note: Note, start: number): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const begin = start + note.at;
    const end = begin + note.length;
    const [from, to] = Array.isArray(note.freq) ? note.freq : [note.freq, note.freq];

    oscillator.type = note.wave ?? 'sine';
    oscillator.frequency.setValueAtTime(from, begin);
    if (to !== from) {
      oscillator.frequency.exponentialRampToValueAtTime(to, end);
    }
    gain.gain.setValueAtTime(0.0001, begin);
    gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.12, begin + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(begin);
    oscillator.stop(end + 0.02);
  }
}
