import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/** The event browsers fire when the page can be installed as an app (not in the DOM typings). */
interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

/**
 * Installing the game as an app. Android and desktop browsers offer a prompt that a button
 * can open; the iPhone has none, so players there get the steps to follow instead.
 */
@Injectable({ providedIn: 'root' })
export class AppInstall {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly promptEvent = signal<InstallPromptEvent | undefined>(undefined);

  /** Already running as an installed app. */
  readonly installed = signal(this.isStandalone());
  /** The browser has an install prompt ready for a button to open. */
  readonly canPrompt = computed(() => !!this.promptEvent() && !this.installed());
  /** An iPhone or iPad in the browser: installing is done by hand, from the share menu. */
  readonly needsManualSteps = computed(() => this.isAppleTouchDevice() && !this.installed());

  constructor() {
    this.window?.addEventListener('beforeinstallprompt', (event) => {
      // Keep it for our own button instead of the browser's banner.
      event.preventDefault();
      this.promptEvent.set(event as InstallPromptEvent);
    });
    this.window?.addEventListener('appinstalled', () => {
      this.promptEvent.set(undefined);
      this.installed.set(true);
    });
  }

  /** Opens the browser's install prompt. It can only be used once. */
  async install(): Promise<void> {
    const event = this.promptEvent();
    this.promptEvent.set(undefined);
    await event?.prompt();
  }

  private isStandalone(): boolean {
    const navigator = this.window?.navigator as (Navigator & { standalone?: boolean }) | undefined;
    return (
      !!this.window?.matchMedia?.('(display-mode: standalone)').matches || !!navigator?.standalone
    );
  }

  private isAppleTouchDevice(): boolean {
    const navigator = this.window?.navigator;
    if (!navigator) {
      return false;
    }
    // iPads say they are Macs, but only they have a touch screen.
    return (
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    );
  }
}
