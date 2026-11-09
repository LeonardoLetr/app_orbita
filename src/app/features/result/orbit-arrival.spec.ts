import { TestBed } from '@angular/core/testing';
import { OrbitArrival } from './orbit-arrival';

describe('OrbitArrival', () => {
  function render() {
    const fixture = TestBed.createComponent(OrbitArrival);
    fixture.componentRef.setInput('planet', 'saturn');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the destination planet', () => {
    const element = render();

    expect(element.querySelector('app-planet-art')).not.toBeNull();
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it('flies the rocket in and then around the planet', () => {
    const motions = render().querySelectorAll('animateMotion');

    expect(motions).toHaveLength(2);
    expect(motions[1].getAttribute('begin')).toBe(`${motions[0].getAttribute('id')}.end`);
    expect(motions[1].getAttribute('repeatCount')).toBe('indefinite');
  });

  it('draws the rocket inside the SVG', () => {
    const rocket = render().querySelector('svg g[appRocketShape] path');

    expect(rocket?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });
});
