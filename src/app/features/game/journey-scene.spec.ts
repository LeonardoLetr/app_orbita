import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EXTENDED_ROUTE, PLANETS } from '../../core/data/planets';
import { STORAGE, createMemoryStore } from '../../core/utils/storage';
import { JourneyScene, flightDuration } from './journey-scene';
import { LIFTOFF_MS } from './launch-layers';

describe('flightDuration', () => {
  it('does not fly when nothing was gained', () => {
    expect(flightDuration(20, 20)).toBe(0);
  });

  it('takes longer for longer trips, within limits', () => {
    const short = flightDuration(0, 10);
    const long = flightDuration(0, 30);

    expect(short).toBeGreaterThanOrEqual(1000);
    expect(long).toBeGreaterThan(short);
    expect(flightDuration(0, 30)).toBeLessThanOrEqual(3800);
  });

  it('is short in quick rounds, whatever the distance', () => {
    expect(flightDuration(20, 20, 'quick')).toBe(0);
    expect(flightDuration(0, 10, 'quick')).toBeLessThan(flightDuration(0, 10));
    expect(flightDuration(0, 10, 'quick')).toBeLessThan(flightDuration(0, 100, 'quick'));
    expect(flightDuration(0, 600, 'quick')).toBe(1200);
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
    vi.advanceTimersByTime(flightDuration(0, 50) / 2);
    const halfway = Number(scene().style.getPropertyValue('--pos'));
    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(50);

    vi.advanceTimersByTime(flightDuration(0, 50));
    expect(scene().style.getPropertyValue('--pos')).toBe('50');
  });

  it('names the planet it passes on a banner, for a moment', () => {
    progress(50, 1);
    expect(element().querySelector('.arrival')).toBeNull();

    vi.advanceTimersByTime(flightDuration(0, 50));
    fixture.detectChanges();
    expect(element().querySelector('.arrival')?.textContent).toContain('Você passou por Lua!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(element().querySelector('.arrival')).toBeNull();
  });

  it('has rocks and comets adrift in the long stretches, the same every time', () => {
    const places = () =>
      [...element().querySelectorAll<HTMLElement>('.debris')].map((item) =>
        item.style.getPropertyValue('--at'),
      );
    const first = places();

    expect(first.length).toBeGreaterThan(10);
    expect(element().querySelector('.debris.is-comet')).not.toBeNull();
    fixture.componentRef.setInput('route', [...PLANETS]);
    fixture.detectChanges();
    expect(places()).toEqual(first);
  });

  it('flies faster in quick rounds', () => {
    fixture.componentRef.setInput('pace', 'quick');
    progress(50, 1);

    expect(flightDuration(0, 50, 'quick')).toBeLessThan(flightDuration(0, 50));
    vi.advanceTimersByTime(flightDuration(0, 50, 'quick'));
    fixture.detectChanges();
    expect(scene().classList).not.toContain('is-flying');
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
    vi.advanceTimersByTime(flightDuration(0, 10) + 50);
    progress(10, 2);

    expect(scene().classList).toContain('is-sputtering');
    expect(scene().style.getPropertyValue('--pos')).toBe('10');
  });

  it('takes off from the launch pad after the countdown', () => {
    fixture.componentRef.setInput('launching', true);
    fixture.detectChanges();

    expect(element().querySelector('app-launch-layers .pad')).not.toBeNull();
    expect(scene().classList).toContain('is-launching');
    expect(scene().classList).not.toContain('is-liftoff');

    vi.advanceTimersByTime(LIFTOFF_MS);
    fixture.detectChanges();
    expect(scene().classList).toContain('is-liftoff');
    expect(element().querySelector('.flame')?.classList).toContain('is-boosting');

    fixture.componentRef.setInput('launching', false);
    fixture.detectChanges();
    expect(element().querySelector('app-launch-layers')).toBeNull();
    expect(scene().classList).not.toContain('is-liftoff');
  });

  it('shows the stops of the route it is given', () => {
    expect(element().querySelectorAll('.stop')).toHaveLength(7);

    fixture.componentRef.setInput('route', EXTENDED_ROUTE);
    fixture.detectChanges();

    expect(element().querySelectorAll('.stop')).toHaveLength(12);
    expect(stop('Proxima Centauri').textContent).toContain('40 trilhões de km');
  });

  it('flies along the longer route past Pluto', () => {
    fixture.componentRef.setInput('route', EXTENDED_ROUTE);
    progress(800, 1);

    vi.advanceTimersByTime(flightDuration(0, 800) + 50);
    fixture.detectChanges();
    expect(scene().style.getPropertyValue('--pos')).toBe('800');
    expect(stop('Éris').classList).toContain('is-lit');
  });

  it('keeps every stop where its points put it on the map', () => {
    expect(stop('Lua').style.getPropertyValue('--at')).toBe('40');
    expect(stop('Plutão').style.getPropertyValue('--at')).toBe('600');
  });

  it('leaves the map still between answers', () => {
    progress(50, 1);
    vi.advanceTimersByTime(flightDuration(0, 50) + 8000);
    fixture.detectChanges();

    expect(scene().style.getPropertyValue('--pos')).toBe('50');
  });
});
