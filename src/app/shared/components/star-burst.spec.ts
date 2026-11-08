import { TestBed } from '@angular/core/testing';
import { StarBurst } from './star-burst';

describe('StarBurst', () => {
  it('throws the requested number of stars in turns of colors', () => {
    const fixture = TestBed.createComponent(StarBurst);
    fixture.componentRef.setInput('count', 6);
    fixture.componentRef.setInput('colors', ['bg-comet', 'bg-star-300']);
    fixture.detectChanges();

    const stars = (fixture.nativeElement as HTMLElement).querySelectorAll('.star-particle');
    expect(stars).toHaveLength(6);
    expect(stars[0].classList).toContain('bg-comet');
    expect(stars[1].classList).toContain('bg-star-300');
  });

  it('is hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(StarBurst);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
});
