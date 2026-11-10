import { Injectable, inject, signal } from '@angular/core';
import { AudioOutput } from './audio-output';
import { PreferencesService } from './preferences-service';

/** Steps (sixteenth notes) in a bar, and bars in the loop. */
const STEPS = 16;
const BARS = 4;
/** Steps planned at a time: a change of pace is heard within one beat. */
const CHUNK = 4;
/** Beats per minute of the tune, and of the same tune when time is running out. */
const TEMPO = 118;
const URGENT_TEMPO = 164;
const VOLUME = 0.13;

/** C, G, A minor and F: one chord for each bar, as bass note and triad. */
const CHORDS = [
  { bass: 65.41, triad: [261.63, 329.63, 392.0] },
  { bass: 49.0, triad: [246.94, 293.66, 392.0] },
  { bass: 55.0, triad: [261.63, 329.63, 440.0] },
  { bass: 43.65, triad: [261.63, 349.23, 440.0] },
];

const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;
const C6 = 1046.5;
const _ = 0;
/** The tune, one bar per line: a bouncy phrase that goes up, answers and comes back down. */
const MELODY = [
  [E5, _, G5, _, A5, _, G5, _, E5, _, _, _, G5, _, _, _],
  [D5, _, G5, _, A5, _, G5, _, D5, _, _, _, E5, _, D5, _],
  [C5, _, E5, _, A5, _, E5, _, C6, _, A5, _, G5, _, E5, _],
  [A5, _, _, G5, _, _, E5, _, D5, _, C5, _, D5, _, _, _],
];
/** Steps where the bass plays; it jumps an octave on the off beats marked here. */
const BASS_STEPS = [0, 3, 6, 8, 11, 14];
const BASS_JUMPS = [6, 14];

/**
 * Generated game music: an upbeat little tune with bass, chords and drums, made on the
 * fly with Web Audio, so there is no file to download. While `urgent` is on, the same tune
 * runs faster, the drums double up and an alarm beeps on every beat.
 */
@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly output = inject(AudioOutput);
  readonly enabled = inject(PreferencesService).musicEnabled;
  /** Time is running out: the music speeds up and sounds the alarm. */
  readonly urgent = signal(false);

  private master?: GainNode;
  private noise?: AudioBuffer;
  private timer?: ReturnType<typeof setTimeout>;
  private step = 0;
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
    this.master.gain.exponentialRampToValueAtTime(VOLUME, now + 0.6);
    this.master.connect(context.destination);
    this.noise = this.createNoise(context);

    this.step = 0;
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
    if (!master || !context) {
      return;
    }
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    setTimeout(() => master.disconnect(), 900);
  }

  /** Plans a few steps ahead, then wakes up shortly before they end to plan the next ones. */
  private scheduleNext(context: AudioContext): void {
    const urgent = this.urgent();
    const stepSeconds = 60 / (urgent ? URGENT_TEMPO : TEMPO) / 4;
    for (let i = 0; i < CHUNK; i++) {
      this.playStep(context, this.step, this.nextAt, stepSeconds, urgent);
      this.step = (this.step + 1) % (STEPS * BARS);
      this.nextAt += stepSeconds;
    }
    const wait = Math.max(25, (this.nextAt - context.currentTime - 0.1) * 1000);
    this.timer = setTimeout(() => this.scheduleNext(context), wait);
  }

  private playStep(
    context: AudioContext,
    step: number,
    at: number,
    stepSeconds: number,
    urgent: boolean,
  ): void {
    const bar = Math.floor(step / STEPS);
    const beat = step % STEPS;
    const chord = CHORDS[bar];

    const tune = MELODY[bar][beat];
    if (tune) {
      this.note(context, 'square', tune, at, stepSeconds * 1.8, 0.16);
    }
    if (BASS_STEPS.includes(beat)) {
      const jump = BASS_JUMPS.includes(beat) ? 2 : 1;
      this.note(context, 'triangle', chord.bass * 2 * jump, at, stepSeconds * 1.6, 0.5);
    }
    if (beat % 2 === 0) {
      const tone = chord.triad[[0, 1, 2, 1][(beat / 2) % 4]];
      this.note(context, 'triangle', tone, at, stepSeconds * 1.2, 0.12);
    }

    // Drums: kick on the beat, snare on the back beat, hats in between.
    if (beat % 8 === 0 || (urgent && beat % 4 === 0)) {
      this.kick(context, at);
    }
    if (beat % 8 === 4) {
      this.hit(context, at, 0.12, 1800, 0.35);
    }
    if (urgent || beat % 4 === 2) {
      this.hit(context, at, 0.04, 7000, 0.14);
    }
    // The alarm: two high notes taking turns on every beat.
    if (urgent && beat % 4 === 0) {
      this.note(context, 'square', beat % 8 === 0 ? 1318.51 : 1046.5, at, stepSeconds * 1.5, 0.2);
    }
  }

  private note(
    context: AudioContext,
    wave: OscillatorType,
    freq: number,
    at: number,
    length: number,
    volume: number,
  ): void {
    const oscillator = context.createOscillator();
    oscillator.type = wave;
    oscillator.frequency.value = freq;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(gain).connect(this.master!);
    oscillator.start(at);
    oscillator.stop(at + length + 0.02);
  }

  private kick(context: AudioContext, at: number): void {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, at);
    oscillator.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.9, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    oscillator.connect(gain).connect(this.master!);
    oscillator.start(at);
    oscillator.stop(at + 0.18);
  }

  /** A burst of filtered noise: low and long for the snare, high and short for a hat. */
  private hit(
    context: AudioContext,
    at: number,
    length: number,
    freq: number,
    volume: number,
  ): void {
    const source = context.createBufferSource();
    source.buffer = this.noise!;
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = freq;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(at);
    source.stop(at + length + 0.02);
  }

  private createNoise(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 0.2),
      context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
