import { TestBed } from '@angular/core/testing';
import { FlightBadge, FlightBadgeData } from './flight-badge';

describe('FlightBadge', () => {
  function render(badge: FlightBadgeData) {
    const fixture = TestBed.createComponent(FlightBadge);
    fixture.componentRef.setInput('badge', badge);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows level, points, distance and the tone of the level', () => {
    const element = render({
      key: 1,
      text: 'Pulsar +75',
      tone: 'is-pulsar',
      km: '12 milhões de km',
    });

    expect(element.querySelector('.badge')?.classList).toContain('is-pulsar');
    expect(element.textContent).toContain('Pulsar +75');
    expect(element.textContent).toContain('+12 milhões de km');
    expect(element.querySelector('.badge-note')).toBeNull();
  });

  it('adds the right spelling below when there is one', () => {
    const element = render({
      key: 1,
      text: 'Cometa +50',
      tone: 'is-comet',
      note: 'Valeu como “Orca”',
    });

    expect(element.querySelector('.badge-note')?.textContent).toContain('Valeu como “Orca”');
  });
});
