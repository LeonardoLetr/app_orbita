import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HeightVar } from './height-var';

@Component({
  imports: [HeightVar],
  template: '<section><div appHeightVar="--bar-height"></div></section>',
})
class Host {}

describe('HeightVar', () => {
  let resized: (() => void) | undefined;
  let disconnected = false;

  beforeEach(() => {
    resized = undefined;
    disconnected = false;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {
          disconnected = true;
        }
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const parent = (fixture.nativeElement as HTMLElement).querySelector('section')!;
    const element = parent.querySelector('div')!;
    return { fixture, parent, element };
  }

  function setHeight(element: HTMLElement, height: number) {
    Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
  }

  it('publishes its height in a variable of its parent', async () => {
    const { parent } = await render();

    expect(parent.style.getPropertyValue('--bar-height')).toBe('0px');
  });

  it('follows the height as it changes', async () => {
    const { parent, element } = await render();

    setHeight(element, 72);
    resized!();

    expect(parent.style.getPropertyValue('--bar-height')).toBe('72px');
  });

  it('stops watching when destroyed', async () => {
    const { fixture } = await render();
    fixture.destroy();

    expect(disconnected).toBe(true);
  });
});
