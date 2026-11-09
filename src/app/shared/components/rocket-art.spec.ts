import { TestBed } from '@angular/core/testing';
import { RocketArt } from './rocket-art';

describe('RocketArt', () => {
  it('boosts the flame on demand', () => {
    const fixture = TestBed.createComponent(RocketArt);
    fixture.detectChanges();
    const flame = (fixture.nativeElement as HTMLElement).querySelector('.flame')!;
    expect(flame.classList).not.toContain('is-boosting');

    fixture.componentRef.setInput('boosting', true);
    fixture.detectChanges();

    expect(flame.classList).toContain('is-boosting');
  });

  it('can point up with the flag still upright', () => {
    const fixture = TestBed.createComponent(RocketArt);
    fixture.componentRef.setInput('upright', true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.classList).toContain('aspect-[36/64]');
    expect(element.querySelector('svg')?.classList).toContain('-rotate-90');
    expect(element.querySelector('g[transform]')?.getAttribute('transform')).toBe(
      'rotate(90 26 18)',
    );
  });
});
