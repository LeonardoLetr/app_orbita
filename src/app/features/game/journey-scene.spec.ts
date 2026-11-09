import { ComponentFixture, TestBed } from '@angular/core/testing';
import { STORAGE, createMemoryStore } from '../../core/utils/storage';
import { JourneyScene, flightDuration } from './journey-scene';

describe('flightDuration', () => {
  it('does not fly when nothing was gained', () => {
    expect(flightDuration(20, 20)).toBe(0);
  });

  it('takes longer for longer trips, within limits', () => {
    const short = flightDuration(0, 10);
    const long = flightDuration(0, 30);

    expect(short).toBeGreaterThanOrEqual(1300);
    expect(long).toBeGreaterThan(short);
    expect(flightDuration(0, 150)).toBeLessThanOrEqual(6000);
  });
});

describe('JourneyScene', () => {
  let fixture: ComponentFixture<JourneyScene>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE, useFactory: createMemoryStore }],
    });
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

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function scene(): HTMLElement {
    return element().querySelector('.scene')!;
  }

  function stop(name: string): HTMLElement {
    return [...element().querySelectorAll<HTMLElement>('.stop')].find((s) =>
      s.textContent?.includes(name),
    )!;
  }

  it('starts on Earth with the next planets ahead', () => {
    expect(scene().style.getPropertyValue('--pos')).toBe('0');
    expect(element().querySelector('.earth')).not.toBeNull();
    expect(stop('Lua').textContent).toContain('384 mil km');
    expect(stop('Lua').classList).not.toContain('is-lit');
  });

  it('climbs by the points earned', () => {
    progress(50, 1);

    expect(scene().classList).toContain('is-flying');
    expect(Number(scene().style.getPropertyValue('--pos'))).toBeCloseTo(1.17, 2);
    expect(scene().style.getPropertyValue('--flight')).toBe(`${flightDuration(0, 50)}ms`);
  });

  it('lights up the planets it passes', () => {
    progress(50, 1);

    vi.advanceTimersByTime(flightDuration(0, 50));
    fixture.detectChanges();

    expect(stop('Lua').classList).toContain('is-lit');
    expect(scene().classList).not.toContain('is-flying');
  });

  it('sputters in place when an answer scores nothing', () => {
    progress(10, 1);
    progress(10, 2);

    expect(scene().classList).toContain('is-sputtering');
    expect(scene().style.getPropertyValue('--pos')).toBe('0.25');
  });
});
