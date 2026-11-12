import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Publishes the height of the element, as it changes, in a CSS variable of its parent,
 * so what sits beside it can keep clear of it.
 */
@Directive({ selector: '[appHeightVar]' })
export class HeightVar {
  /** Name of the variable, such as `--dock-height`. */
  readonly name = input.required<string>({ alias: 'appHeightVar' });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const publish = () =>
        element.parentElement?.style.setProperty(this.name(), `${element.offsetHeight}px`);
      publish();
      // Not available in unit tests.
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(publish);
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
