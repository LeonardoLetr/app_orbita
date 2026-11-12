import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScreenStage, VISUAL_VIEWPORT } from './screen-stage';

@Component({
  imports: [ScreenStage],
  template: '<div appScreenStage></div>',
})
class Host {}

class FakeViewport extends EventTarget {
  width = 400;
  height = 700;
  offsetTop = 0;
}

describe('ScreenStage', () => {
  function render(viewport: FakeViewport | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: VISUAL_VIEWPORT, useValue: viewport }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, element: (fixture.nativeElement as HTMLElement).querySelector('div')! };
  }

  function resize(viewport: FakeViewport, change: Partial<FakeViewport>) {
    Object.assign(viewport, change);
    viewport.dispatchEvent(new Event('resize'));
  }

  const inset = (element: HTMLElement) => element.style.getPropertyValue('--keyboard-inset');

  it('fills the screen', () => {
    const { element } = render(new FakeViewport());

    expect(element.style.height).toBe('700px');
    expect(element.style.top).toBe('0px');
    expect(inset(element)).toBe('0px');
    expect(element.classList.contains('is-compact')).toBe(false);
  });

  it('keeps its size when the keyboard opens, and tells how much it covers', () => {
    const viewport = new FakeViewport();
    const { element } = render(viewport);

    resize(viewport, { height: 380, offsetTop: 120 });

    expect(element.style.height).toBe('700px');
    expect(element.style.top).toBe('120px');
    expect(inset(element)).toBe('320px');
    expect(element.classList.contains('is-compact')).toBe(true);
  });

  it('is uncovered again when the keyboard closes', () => {
    const viewport = new FakeViewport();
    const { element } = render(viewport);

    resize(viewport, { height: 380 });
    resize(viewport, { height: 700 });

    expect(inset(element)).toBe('0px');
    expect(element.classList.contains('is-compact')).toBe(false);
  });

  it('grows with a screen that gets taller', () => {
    const viewport = new FakeViewport();
    const { element } = render(viewport);

    resize(viewport, { height: 760 });

    expect(element.style.height).toBe('760px');
    expect(inset(element)).toBe('0px');
  });

  it('starts over when the phone is turned', () => {
    const viewport = new FakeViewport();
    const { element } = render(viewport);

    resize(viewport, { width: 700, height: 400 });

    expect(element.style.height).toBe('400px');
    expect(inset(element)).toBe('0px');
    expect(element.classList.contains('is-compact')).toBe(true);
  });

  it('stops listening when destroyed', () => {
    const viewport = new FakeViewport();
    const { fixture, element } = render(viewport);
    fixture.destroy();

    resize(viewport, { height: 100 });

    expect(inset(element)).toBe('0px');
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
