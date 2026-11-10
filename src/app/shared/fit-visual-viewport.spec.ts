import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FitVisualViewport, VISUAL_VIEWPORT } from './fit-visual-viewport';

@Component({
  imports: [FitVisualViewport],
  template: '<div appFitVisualViewport></div>',
})
class Host {}

class FakeViewport extends EventTarget {
  height = 700;
  offsetTop = 0;
}

describe('FitVisualViewport', () => {
  function render(viewport: FakeViewport | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: VISUAL_VIEWPORT, useValue: viewport }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, element: (fixture.nativeElement as HTMLElement).querySelector('div')! };
  }

  it('matches the visible area', () => {
    const { element } = render(new FakeViewport());

    expect(element.style.height).toBe('700px');
    expect(element.style.top).toBe('0px');
  });

  it('follows the keyboard opening', () => {
    const viewport = new FakeViewport();
    const { element } = render(viewport);

    viewport.height = 380;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('resize'));

    expect(element.style.height).toBe('380px');
    expect(element.style.top).toBe('120px');
  });

  it('stops listening when destroyed', () => {
    const viewport = new FakeViewport();
    const { fixture, element } = render(viewport);
    fixture.destroy();

    viewport.height = 100;
    viewport.dispatchEvent(new Event('resize'));

    expect(element.style.height).toBe('700px');
  });

  it('leaves the element alone without visual viewport support', () => {
    const { element } = render(null);

    expect(element.style.height).toBe('');
  });

  /** Stands in for the browser scrolling the element to show a focused field. */
  function scrollBy(element: HTMLElement, top: number, left = 0) {
    const position = { top, left };
    Object.defineProperty(element, 'scrollTop', {
      configurable: true,
      get: () => position.top,
      set: (value: number) => (position.top = value),
    });
    Object.defineProperty(element, 'scrollLeft', {
      configurable: true,
      get: () => position.left,
      set: (value: number) => (position.left = value),
    });
    element.dispatchEvent(new Event('scroll'));
    return position;
  }

  it('puts its content back when the browser scrolls it', () => {
    const { element } = render(new FakeViewport());

    expect(scrollBy(element, 232, 4)).toEqual({ top: 0, left: 0 });
  });

  it('holds its content in place without visual viewport support too', () => {
    const { element } = render(null);

    expect(scrollBy(element, 40)).toEqual({ top: 0, left: 0 });
  });

  it('lets go of its content when destroyed', () => {
    const { fixture, element } = render(new FakeViewport());
    fixture.destroy();

    expect(scrollBy(element, 40)).toEqual({ top: 40, left: 0 });
  });
});
