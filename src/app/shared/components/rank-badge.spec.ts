import { TestBed } from '@angular/core/testing';
import { RANKS } from '../../core/data/ranks';
import { RankBadge } from './rank-badge';

describe('RankBadge', () => {
  function render(level: number) {
    const fixture = TestBed.createComponent(RankBadge);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('svg')!;
  }
  const chevrons = (svg: SVGElement) => svg.querySelectorAll('path[stroke-linecap]').length;
  const stars = (svg: SVGElement) => svg.querySelectorAll('path[transform]').length;

  it('draws a different insignia for every rank', () => {
    const drawings = RANKS.map((_, level) => render(level).innerHTML);

    expect(new Set(drawings).size).toBe(RANKS.length);
  });

  it('gives chevrons to the first ranks and stars to the next ones', () => {
    expect([0, 1, 2].map((level) => chevrons(render(level)))).toEqual([1, 2, 3]);
    expect([0, 1, 2].map((level) => stars(render(level)))).toEqual([0, 0, 0]);
    expect([3, 4, 5].map((level) => stars(render(level)))).toEqual([1, 2, 3]);
    expect(chevrons(render(4))).toBe(0);
  });

  it('crowns the top rank', () => {
    expect(stars(render(6))).toBe(4);
  });

  it('is hidden from screen readers, which get the name next to it', () => {
    expect(render(2).getAttribute('aria-hidden')).toBe('true');
  });
});
