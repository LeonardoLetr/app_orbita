import { DOCUMENT, Injectable, InjectionToken, inject } from '@angular/core';

/** Creates the audio context, or null when the browser has no Web Audio. */
export const AUDIO_CONTEXT_FACTORY = new InjectionToken<() => AudioContext | null>(
  'AUDIO_CONTEXT_FACTORY',
  {
    providedIn: 'root',
    factory: () => () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
  },
);

/** The single audio context shared by sound effects and music, created on first use. */
@Injectable({ providedIn: 'root' })
export class AudioOutput {
  private readonly createContext = inject(AUDIO_CONTEXT_FACTORY);
  private readonly document = inject(DOCUMENT);
  private context?: AudioContext | null;

  /** The audio context, woken up if the browser suspended it; null without Web Audio. */
  get(): AudioContext | null {
    if (this.context === undefined) {
      try {
        this.context = this.createContext();
      } catch {
        this.context = null;
      }
      if (this.context) {
        this.resumeOnFirstGesture(this.context);
      }
    }
    if (this.context?.state === 'suspended') {
      void this.context.resume().catch(() => undefined);
    }
    return this.context;
  }

  /** Browsers only allow audio after the page is used; try again on the next tap or key. */
  private resumeOnFirstGesture(context: AudioContext): void {
    const resume = () => {
      void context.resume().catch(() => undefined);
      this.document.removeEventListener('pointerdown', resume);
      this.document.removeEventListener('keydown', resume);
    };
    this.document.addEventListener('pointerdown', resume);
    this.document.addEventListener('keydown', resume);
  }
}
