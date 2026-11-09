import { TestBed } from '@angular/core/testing';
import { TimerRing } from './timer-ring';

describe('TimerRing', () => {
  function render(seconds: number, progress: number) {
    const fixture = TestBed.createComponent(TimerRing);
    fixture.componentRef.setInput('seconds', seconds);
    fixture.componentRef.setInput('progress', progress);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the seconds left and describes them for screen readers', () => {
    const element = render(17, 0.5);

    expect(element.textContent?.trim()).toBe('17');
    expect(element.getAttribute('aria-label')).toBe('Tempo restante: 17 segundos');
  });

  it('empties the ring as time passes', () => {
    const ring = render(15, 0.5).querySelector('circle.progress')!;
    expect(ring.getAttribute('stroke-dasharray')).not.toBeNull();
    const length = Number(ring.getAttribute('stroke-dasharray'));

    expect(Number(ring.getAttribute('stroke-dashoffset'))).toBeCloseTo(length / 2);
  });

  it('turns red in the last seconds', () => {
    expect(render(4, 0.1).querySelector('circle.progress')?.classList).toContain(
      'stroke-flare-500',
    );
  });
});
