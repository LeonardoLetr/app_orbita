import { DestroyRef, Directive, ElementRef, InjectionToken, inject } from '@angular/core';

/** The browser visual viewport, or null where it is not supported. */
export const VISUAL_VIEWPORT = new InjectionToken<VisualViewport | null>('VISUAL_VIEWPORT', {
  providedIn: 'root',
  factory: () => globalThis.visualViewport ?? null,
});

/**
 * Keeps a fixed element exactly over the part of the screen that is visible.
 * On phones this is the area above the keyboard, so content at the bottom of the
 * element sits right on top of the keyboard on both iOS and Android.
 */
@Directive({ selector: '[appFitVisualViewport]' })
export class FitVisualViewport {
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

    const fit = () => {
      element.style.top = `${viewport.offsetTop}px`;
      element.style.height = `${viewport.height}px`;
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
