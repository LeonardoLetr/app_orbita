import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JourneyScene, TRAVEL_MS } from './journey-scene';

describe('JourneyScene', () => {
  let fixture: ComponentFixture<JourneyScene>;

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(JourneyScene);
    progress(0, 0);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  function progress(points: number, answers: number) {
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('answers', answers);
    fixture.detectChanges();
  }

  function scene(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('.scene')!;
  }

  function stops(): HTMLElement[] {
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.stop')];
  }

  it('starts at Earth with only Earth lit', () => {
    expect(scene().style.getPropertyValue('--pos')).toBe('0');
    expect(stops().filter((stop) => stop.classList.contains('is-lit'))).toHaveLength(1);
  });

  it('flies forward and shows the points gained', () => {
    progress(20, 1);

    expect(scene().classList).toContain('is-traveling');
    expect(scene().style.getPropertyValue('--pos')).toBe('1');
    expect(scene().querySelector('.gain')?.textContent).toContain('+20');

    vi.advanceTimersByTime(TRAVEL_MS);
    fixture.detectChanges();
    expect(scene().classList).not.toContain('is-traveling');
  });

  it('lights up the planet when the rocket arrives', () => {
    progress(20, 1);
    expect(stops()[1].classList).not.toContain('is-lit');

    vi.advanceTimersByTime(TRAVEL_MS);
    fixture.detectChanges();

    expect(stops()[1].classList).toContain('is-lit');
    expect(stops()[1].classList).toContain('is-arriving');
  });

  it('sputters in place when an answer scores nothing', () => {
    progress(10, 1);
    progress(10, 2);

    expect(scene().classList).toContain('is-sputtering');
    expect(scene().style.getPropertyValue('--pos')).toBe('0.5');
  });
});
