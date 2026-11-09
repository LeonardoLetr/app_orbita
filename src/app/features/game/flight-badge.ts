import { Component, input } from '@angular/core';
import { StarBurst } from '../../shared/components/star-burst';

export interface FlightBadgeData {
  /** Changes for every answer, so the badge pops in again. */
  key: number;
  text: string;
  tone: 'is-satellite' | 'is-meteorite' | 'is-comet' | 'is-pulsar' | 'is-supernova' | 'is-zero';
  burst?: readonly string[];
  /** Distance travelled, already formatted. */
  km?: string;
  /** Correct spelling, when the answer counted as a synonym or with a typo forgiven. */
  note?: string;
}

/** Result of an answer shown next to the rocket: level, points and distance travelled. */
@Component({
  selector: 'app-flight-badge',
  imports: [StarBurst],
  host: { class: 'flex flex-col items-center gap-1.5' },
  template: `
    <div class="badge" [class]="badge().tone">
      @if (badge().burst; as colors) {
        <app-star-burst [colors]="colors" [count]="12" [reach]="5" />
      }
      <span class="badge-name">{{ badge().text }}</span>
      @if (badge().km; as km) {
        <span class="badge-km">+{{ km }}</span>
      }
    </div>
    @if (badge().note; as note) {
      <p class="badge-note">{{ note }}</p>
    }
  `,
  styles: `
    .badge {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem;
      border-radius: 999px;
      background: rgb(238 240 255 / 0.95);
      box-shadow: 0 0.5rem 1.5rem -0.5rem rgb(0 0 0 / 0.7);
      white-space: nowrap;
    }

    .badge-name {
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      background: var(--color-space-200);
      font-family: var(--font-display);
      font-size: max(1rem, calc(var(--u, 0.4rem) * 2.6));
      font-weight: 700;
      color: var(--color-space-950);
    }

    .badge-km {
      padding-right: 0.6rem;
      font-size: max(0.85rem, calc(var(--u, 0.4rem) * 2.1));
      font-weight: 700;
      color: var(--color-space-700);
    }

    .is-satellite .badge-name {
      background: var(--color-satellite);
    }

    .is-meteorite .badge-name {
      background: var(--color-meteorite);
    }

    .is-comet .badge-name {
      background: var(--color-comet);
    }

    .is-pulsar .badge-name {
      background: var(--color-pulsar);
    }

    .is-supernova .badge-name {
      background: var(--color-supernova);
    }

    .badge-note {
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
      background: rgb(11 16 48 / 0.85);
      font-size: max(0.8rem, calc(var(--u, 0.4rem) * 2));
      font-weight: 700;
      white-space: nowrap;
      color: var(--color-space-50);
    }

    @media (prefers-reduced-motion: no-preference) {
      .badge,
      .badge-note {
        animation: badge-in 450ms cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
      }
    }

    @keyframes badge-in {
      from {
        opacity: 0;
        scale: 0.6;
        translate: 0 0.6rem;
      }
    }
  `,
})
export class FlightBadge {
  readonly badge = input.required<FlightBadgeData>();
}
