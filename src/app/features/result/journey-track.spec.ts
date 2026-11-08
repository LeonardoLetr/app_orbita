import { TestBed } from '@angular/core/testing';
import { PlanetId } from '../../core/models/planet';
import { JourneyTrack } from './journey-track';

describe('JourneyTrack', () => {
  function render(reached: PlanetId) {
    const fixture = TestBed.createComponent(JourneyTrack);
    fixture.componentRef.setInput('reached', reached);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lights up every stop up to the planet reached', () => {
    const element = render('mars');
    const stops = [...element.querySelectorAll('app-planet-art')];

    expect(stops).toHaveLength(8);
    expect(stops.filter((stop) => !stop.classList.contains('grayscale'))).toHaveLength(3);
  });

  it('moves the ship to the planet reached', () => {
    const ship = render('pluto').querySelector<SVGElement>('svg.w-10')!;

    expect(ship.style.left).toBe('100%');
  });

  it('keeps the ship at Earth when nothing was scored', () => {
    const ship = render('earth-orbit').querySelector<SVGElement>('svg.w-10')!;

    expect(ship.style.left).toBe('0%');
  });
});
