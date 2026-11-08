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
});
