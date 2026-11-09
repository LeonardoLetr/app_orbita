import { Injectable, inject } from '@angular/core';
import { RANDOM } from '../utils/random';
import { AudioOutput } from './audio-output';
import { PreferencesService } from './preferences-service';

/** A minor, F, C and G: a calm loop that never resolves too hard. */
const CHORDS = [
  [110, 164.81, 220, 261.63],
  [87.31, 130.81, 174.61, 220],
  [130.81, 196, 261.63, 329.63],
  [98, 146.83, 196, 246.94],
];
/** High notes of the A minor pentatonic scale, for twinkling sparkles. */
const SPARKLES = [880, 1046.5, 1174.66, 1318.51, 1567.98];
const CHORD_SECONDS = 8;
const SPARKLES_PER_CHORD = 3;
const VOLUME = 0.05;

/**
 * Generated ambient space music: soft overlapping chords and random twinkles
 * with an echo. Made on the fly with Web Audio, so there is no file to download.
 */
@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly output = inject(AudioOutput);
  private readonly random = inject(RANDOM);
  readonly enabled = inject(PreferencesService).musicEnabled;

  private master?: GainNode;
  private echo?: DelayNode;
  private timer?: ReturnType<typeof setTimeout>;
  private chord = 0;
  private nextAt = 0;

  get playing(): boolean {
    return this.master !== undefined;
  }

  /** Starts the music if the player turned it on. Safe to call while already playing. */
  start(): void {
    if (!this.enabled() || this.playing) {
      return;
    }
    const context = this.output.get();
    if (!context) {
      return;
    }
    const now = context.currentTime;
    this.master = context.createGain();
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.gain.exponentialRampToValueAtTime(VOLUME, now + 2);
    this.master.connect(context.destination);

    this.echo = context.createDelay(1);
    this.echo.delayTime.value = 0.38;
    const feedback = context.createGain();
    feedback.gain.value = 0.35;
    this.echo.connect(feedback).connect(this.echo);
    this.echo.connect(this.master);

    this.chord = 0;
    this.nextAt = now + 0.1;
    this.scheduleNext(context);
  }

  /** Fades the music out. */
  stop(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    const master = this.master;
    const context = this.output.get();
    this.master = undefined;
    this.echo = undefined;
    if (!master || !context) {
      return;
    }
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    setTimeout(() => master.disconnect(), 1300);
  }

  /** Plans one chord ahead, then wakes up shortly before it ends to plan the next. */
  private scheduleNext(context: AudioContext): void {
    const at = this.nextAt;
    this.playChord(context, CHORDS[this.chord % CHORDS.length], at);
    for (let i = 0; i < SPARKLES_PER_CHORD; i++) {
      const note = SPARKLES[Math.floor(this.random() * SPARKLES.length)];
      this.playSparkle(context, note, at + 0.5 + this.random() * (CHORD_SECONDS - 1.5));
    }
    this.chord++;
    this.nextAt = at + CHORD_SECONDS;
    const wait = Math.max(0, (this.nextAt - context.currentTime - 1) * 1000);
    this.timer = setTimeout(() => this.scheduleNext(context), wait);
  }

  private playChord(context: AudioContext, notes: number[], at: number): void {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.connect(this.master!);

    const end = at + CHORD_SECONDS + 2.5;
    for (const freq of notes) {
      for (const detune of [-5, 5]) {
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = freq;
        oscillator.detune.value = detune;
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.18, at + 2.5);
        gain.gain.setValueAtTime(0.18, at + CHORD_SECONDS - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain).connect(filter);
        oscillator.start(at);
        oscillator.stop(end + 0.05);
      }
    }
  }

  private playSparkle(context: AudioContext, freq: number, at: number): void {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
    oscillator.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.echo!);
    oscillator.start(at);
    oscillator.stop(at + 1.7);
  }
}
