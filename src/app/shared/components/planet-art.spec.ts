import { TestBed } from '@angular/core/testing';
import { PLANETS } from '../../core/data/planets';
import { PlanetArt } from './planet-art';

describe('PlanetArt', () => {
  it('draws every journey stop', () => {
    for (const planet of PLANETS) {
      const fixture = TestBed.createComponent(PlanetArt);
      fixture.componentRef.setInput('planet', planet.id);
      fixture.detectChanges();

      const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
      expect(svg?.querySelectorAll('circle').length, planet.id).toBeGreaterThan(0);
    }
  });
});
