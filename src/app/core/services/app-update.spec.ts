import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdate } from './app-update';

describe('AppUpdate', () => {
  it('stays quiet where there is no service worker', () => {
    expect(TestBed.inject(AppUpdate).ready()).toBe(false);
  });

  describe('with a service worker', () => {
    const versionUpdates = new Subject<{ type: string }>();
    const activateUpdate = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: SwUpdate, useValue: { versionUpdates, activateUpdate } },
          { provide: DOCUMENT, useValue: { location: { reload }, defaultView: window } },
        ],
      });
    });

    it('says so only when a new version is ready to use', () => {
      const update = TestBed.inject(AppUpdate);

      versionUpdates.next({ type: 'VERSION_DETECTED' });
      expect(update.ready()).toBe(false);

      versionUpdates.next({ type: 'VERSION_READY' });
      expect(update.ready()).toBe(true);
    });

    it('switches to the new version and reloads', async () => {
      await TestBed.inject(AppUpdate).apply();

      expect(activateUpdate).toHaveBeenCalledOnce();
      expect(reload).toHaveBeenCalledOnce();
    });
  });
});
