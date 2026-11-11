import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Tells when a newer version of the game was downloaded, and switches to it. */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly document = inject(DOCUMENT);

  /** A newer version is ready; the page shows the old one until it is reloaded. */
  readonly ready = signal(false);

  constructor() {
    this.updates?.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.ready.set(true);
      }
    });
  }

  /** Switches to the new version and reloads the page. */
  async apply(): Promise<void> {
    try {
      await this.updates?.activateUpdate();
    } finally {
      this.document.location.reload();
    }
  }
}
