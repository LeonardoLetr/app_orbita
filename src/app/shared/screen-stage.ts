import { DestroyRef, Directive, ElementRef, InjectionToken, inject } from '@angular/core';

/** The browser visual viewport, or null where it is not supported. */
export const VISUAL_VIEWPORT = new InjectionToken<VisualViewport | null>('VISUAL_VIEWPORT', {
  providedIn: 'root',
  factory: () => globalThis.visualViewport ?? null,
});

/** Up to this visible height (keyboard open, or a phone on its side) there is little room. */
export const COMPACT_HEIGHT = 620;

/**
 * A fixed element that stays the size of the whole screen while the phone keyboard comes
 * and goes, so what is drawn on it never jumps. It is told how much of its bottom is
 * covered, in `--keyboard-inset`, and gets the class `is-compact` when little of it is
 * left in view: its content moves out of the way with transitions of its own.
 *
 * Works the same on iOS, where only the visible area shrinks, and on Android, where the
 * whole page does.
 */
@Directive({ selector: '[appScreenStage]' })
export class ScreenStage {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    // Nothing in the element scrolls. Still, a browser bringing a focused field into view
    // (one tapped while it slides in from below, say) shifts the content of a box that
    // only hides what overflows, and nothing would bring it back.
    const settle = () => {
      if (element.scrollTop !== 0 || element.scrollLeft !== 0) {
        element.scrollTop = 0;
        element.scrollLeft = 0;
      }
    };
    element.addEventListener('scroll', settle);
    destroyRef.onDestroy(() => element.removeEventListener('scroll', settle));

    const viewport = inject(VISUAL_VIEWPORT);
    if (!viewport) {
      return;
    }

    let width = viewport.width;
    // The tallest the screen has been at this width: its height with nothing over it.
    let full = viewport.height;
    const fit = () => {
      if (viewport.width !== width) {
        // The phone was turned: another screen, with another height.
        width = viewport.width;
        full = viewport.height;
      }
      full = Math.max(full, viewport.height);
      element.style.top = `${viewport.offsetTop}px`;
      element.style.height = `${full}px`;
      element.style.setProperty('--keyboard-inset', `${full - viewport.height}px`);
      element.classList.toggle('is-compact', viewport.height <= COMPACT_HEIGHT);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    destroyRef.onDestroy(() => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
    });
  }
}
