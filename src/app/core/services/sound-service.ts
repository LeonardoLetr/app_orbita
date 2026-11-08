import { Injectable, InjectionToken, inject } from '@angular/core';
import { PreferencesService } from './preferences-service';

export type SoundEffect =
  'satellite' | 'comet' | 'supernova' | 'miss' | 'liftoff' | 'arrive' | 'finish';

/** Creates the audio context, or null when the browser has no Web Audio. */
export const AUDIO_CONTEXT_FACTORY = new InjectionToken<() => AudioContext | null>(
  'AUDIO_CONTEXT_FACTORY',
  {
    providedIn: 'root',
    factory: () => () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
  },
);

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
  comet: [
    { freq: 660, at: 0, length: 0.14, wave: 'triangle' },
    { freq: 880, at: 0.11, length: 0.22, wave: 'triangle' },
  ],
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
  private readonly createContext = inject(AUDIO_CONTEXT_FACTORY);
  private context?: AudioContext | null;

  readonly enabled = this.preferences.soundEnabled;

  play(effect: SoundEffect): void {
    if (!this.enabled()) {
      return;
    }
    const context = this.audio();
    if (!context) {
      return;
    }
    // Browsers suspend audio until the page is used; the game always plays after a tap or key.
    if (context.state === 'suspended') {
      void context.resume();
    }
    const start = context.currentTime;
    for (const note of EFFECTS[effect]) {
      this.playNote(context, note, start);
    }
  }

  private audio(): AudioContext | null {
    if (this.context === undefined) {
      try {
        this.context = this.createContext();
      } catch {
        this.context = null;
      }
    }
    return this.context;
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
