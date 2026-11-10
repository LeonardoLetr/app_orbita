import { TestBed } from '@angular/core/testing';
import { EXTENDED_ROUTE } from '../../core/data/planets';
import { PlanetArt } from './planet-art';

describe('PlanetArt', () => {
  it('draws every journey stop', () => {
    for (const planet of EXTENDED_ROUTE) {
      const fixture = TestBed.createComponent(PlanetArt);
      fixture.componentRef.setInput('planet', planet.id);
      fixture.detectChanges();

      const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
      expect(svg?.querySelectorAll('circle').length, planet.id).toBeGreaterThan(0);
    }
  });

  it('shines only on the stops drawn as a ball', () => {
    const shine = (planet: string) => {
      const fixture = TestBed.createComponent(PlanetArt);
      fixture.componentRef.setInput('planet', planet);
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('ellipse[opacity="0.18"]');
    };

    expect(shine('eris')).not.toBeNull();
    expect(shine('voyager')).toBeNull();
    expect(shine('proxima')).toBeNull();
  });
});
