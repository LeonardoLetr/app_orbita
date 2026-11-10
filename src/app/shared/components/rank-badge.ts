import { Component, computed, input } from '@angular/core';

/** Fill of the shield for each level of the career, from cadet to legend. */
const TONES = ['#b9c2d0', '#7ee0a1', '#4fe0f5', '#a78bfa', '#ff7ac8', '#ff9a55', '#ffd23f'];

const STAR = 'M0-9 2.6-2.9 9.5-2.9 3.9 1.1 6 7.6 0 3.5-6 7.6-3.9 1.1-9.5-2.9-2.6-2.9z';

/**
 * Insignia of a rank: a shield with one to three chevrons for the first ranks, one to
 * three stars for the next ones, and a big star with a crown of small ones at the top.
 */
@Component({
  selector: 'app-rank-badge',
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 64 72" class="size-full overflow-visible" aria-hidden="true">
      <path
        d="M32 3 59 12v24c0 16-11 26-27 33C16 62 5 52 5 36V12z"
        [attr.fill]="tone()"
        stroke="#1b1035"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path d="M32 9 53 16v20c0 12-8 20-21 26z" fill="#fff" opacity="0.22" />
      @for (y of chevrons(); track y) {
        <path
          [attr.d]="'M18 ' + (y + 8) + ' 32 ' + y + ' 46 ' + (y + 8)"
          fill="none"
          stroke="#1b1035"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
      @for (star of stars(); track $index) {
        <path
          [attr.d]="starPath"
          [attr.transform]="'translate(' + star.x + ' ' + star.y + ') scale(' + star.size + ')'"
          fill="#1b1035"
        />
      }
    </svg>
  `,
})
export class RankBadge {
  /** Position of the rank in the career, from 0. */
  readonly level = input.required<number>();

  protected readonly starPath = STAR;
  protected readonly tone = computed(() => TONES[Math.min(this.level(), TONES.length - 1)]);

  protected readonly chevrons = computed(() => {
    const count = this.level() < 3 ? this.level() + 1 : 0;
    const first = 34 - (count - 1) * 6;
    return Array.from({ length: count }, (_, index) => first + index * 12 - 4);
  });

  protected readonly stars = computed(() => {
    const level = this.level();
    if (level < 3) {
      return [];
    }
    if (level >= 6) {
      return [
        { x: 32, y: 38, size: 1.5 },
        { x: 17, y: 22, size: 0.5 },
        { x: 32, y: 17, size: 0.5 },
        { x: 47, y: 22, size: 0.5 },
      ];
    }
    const count = level - 2;
    return Array.from({ length: count }, (_, index) => ({
      x: 32 + (index - (count - 1) / 2) * 15,
      y: count === 3 && index === 1 ? 28 : 35,
      size: count === 1 ? 1.4 : 0.8,
    }));
  });
}
