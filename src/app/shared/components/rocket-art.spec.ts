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
});
