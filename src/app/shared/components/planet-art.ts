import { Component, input } from '@angular/core';
import { PlanetId } from '../../core/models/planet';

const CENTER = 60;

/** Horizontal slice of a planet disc between two heights, used for cloud bands and polar caps. */
function band(y1: number, y2: number, r: number): string {
  const halfWidth = (y: number) => Math.sqrt(Math.max(0, r * r - (y - CENTER) ** 2));
  const [top, bottom] = [halfWidth(y1), halfWidth(y2)];
  return (
    `M${CENTER - top} ${y1}H${CENTER + top}` +
    `A${r} ${r} 0 0 1 ${CENTER + bottom} ${y2}H${CENTER - bottom}` +
    `A${r} ${r} 0 0 1 ${CENTER - top} ${y1}Z`
  );
}

/** Night side of a disc lit from the top left: the disc minus a copy shifted toward the light. */
function shadow(r: number, shift = 9): string {
  const offset = shift / 2;
  const distance = Math.hypot(shift, shift);
  const half = Math.sqrt(r * r - (distance / 2) ** 2);
  const [ux, uy] = [Math.SQRT1_2, -Math.SQRT1_2];
  const [mx, my] = [CENTER - offset, CENTER - offset];
  const [x1, y1] = [mx + half * ux, my + half * uy];
  const [x2, y2] = [mx - half * ux, my - half * uy];
  return `M${x1} ${y1}A${r} ${r} 0 1 1 ${x2} ${y2}A${r} ${r} 0 0 0 ${x1} ${y1}Z`;
}

const R = 34;
const RINGED_R = 30;

const SHAPES = {
  shadow: shadow(R),
  ringedShadow: shadow(RINGED_R, 8),
  marsCap: band(26, 31, R),
  jupiterBands: [
    { d: band(36, 41, R), fill: '#c98d5a' },
    { d: band(48, 53, R), fill: '#b5764a' },
    { d: band(61, 66, R), fill: '#d9a877' },
    { d: band(75, 80, R), fill: '#c98d5a' },
  ],
  saturnBands: [
    { d: band(44, 48, RINGED_R), fill: '#d8bb79' },
    { d: band(66, 70, RINGED_R), fill: '#d8bb79' },
  ],
  neptuneBands: [band(40, 43, R), band(71, 73, R)],
};

/** Original flat illustrations of each journey stop. Decorative only. */
@Component({
  selector: 'app-planet-art',
  host: { class: 'inline-block' },
  template: `
    <svg viewBox="0 0 120 120" class="size-full overflow-visible" aria-hidden="true">
      @switch (planet()) {
        @case ('earth-orbit') {
          <ellipse
            cx="60"
            cy="60"
            rx="52"
            ry="16"
            transform="rotate(-20 60 60)"
            fill="none"
            stroke="#6f78b3"
            stroke-width="1.2"
            stroke-dasharray="3 4"
          />
          <circle cx="60" cy="60" [attr.r]="r" fill="#3b82d6" />
          <path d="M44 44c6-6 16-4 18 2s-4 10-2 16-8 8-14 4-4-12-2-22z" fill="#4caf6e" />
          <path d="M68 70c4-3 10-1 11 3s-3 8-8 7-6-6-3-10z" fill="#4caf6e" />
          <path d="M66 36c4-2 9 0 9 3s-5 4-9 3z" fill="#4caf6e" />
          <ellipse cx="50" cy="75" rx="9" ry="2.5" fill="#fff" opacity="0.55" />
          <ellipse cx="74" cy="50" rx="7" ry="2" fill="#fff" opacity="0.55" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
          <g transform="translate(103 38) rotate(-20)">
            <rect x="-9" y="-1.5" width="6" height="3" fill="#4fe0f5" />
            <rect x="3" y="-1.5" width="6" height="3" fill="#4fe0f5" />
            <rect x="-3" y="-2.5" width="6" height="5" rx="1" fill="#eef0ff" />
          </g>
        }
        @case ('moon') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#c9c9d6" />
          <circle cx="48" cy="48" r="7" fill="#a6a6ba" />
          <circle cx="70" cy="66" r="9" fill="#a6a6ba" />
          <circle cx="66" cy="42" r="4" fill="#a6a6ba" />
          <circle cx="47" cy="72" r="4.5" fill="#a6a6ba" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
        }
        @case ('mars') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#d9653b" />
          <path d="M40 58c6-5 16-3 18 2s-6 8-12 7-9-5-6-9z" fill="#a8432a" />
          <path d="M66 68c5-2 12 0 12 4s-6 6-11 4-4-6-1-8z" fill="#a8432a" />
          <path [attr.d]="shapes.marsCap" fill="#fbeee6" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
        }
        @case ('jupiter') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#ecd3ae" />
          @for (stripe of shapes.jupiterBands; track $index) {
            <path [attr.d]="stripe.d" [attr.fill]="stripe.fill" />
          }
          <ellipse cx="72" cy="68" rx="7" ry="4" fill="#b5482f" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
        }
        @case ('saturn') {
          <g transform="rotate(-15 60 60)">
            <ellipse
              cx="60"
              cy="60"
              rx="54"
              ry="13"
              fill="none"
              stroke="#c9ad73"
              stroke-width="5"
            />
          </g>
          <circle cx="60" cy="60" [attr.r]="ringedR" fill="#ead39b" />
          @for (stripe of shapes.saturnBands; track $index) {
            <path [attr.d]="stripe.d" [attr.fill]="stripe.fill" />
          }
          <path [attr.d]="shapes.ringedShadow" fill="#060818" opacity="0.3" />
          <g transform="rotate(-15 60 60)">
            <path d="M6 60A54 13 0 0 0 114 60" fill="none" stroke="#e8d3a2" stroke-width="5" />
          </g>
        }
        @case ('uranus') {
          <g transform="rotate(8 60 60)">
            <ellipse
              cx="60"
              cy="60"
              rx="9"
              ry="50"
              fill="none"
              stroke="#c4eef1"
              stroke-width="2"
              opacity="0.6"
            />
          </g>
          <circle cx="60" cy="60" [attr.r]="r" fill="#9fe3e8" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
          <g transform="rotate(8 60 60)">
            <path
              d="M60 10A9 50 0 0 1 60 110"
              fill="none"
              stroke="#e3fafb"
              stroke-width="2"
              opacity="0.8"
            />
          </g>
        }
        @case ('neptune') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#3d63d8" />
          @for (stripe of shapes.neptuneBands; track $index) {
            <path [attr.d]="stripe" fill="#6b8df0" />
          }
          <ellipse cx="52" cy="58" rx="7" ry="4" fill="#233f9e" />
          <ellipse cx="62" cy="52" rx="6" ry="1.5" fill="#eef0ff" opacity="0.8" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
        }
        @case ('pluto') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#d8b896" />
          <path d="M38 50c4-6 12-6 14 0s-4 12-12 10-6-6-2-10z" fill="#9b6b4f" />
          <path
            d="M60 78c-9-6-14-12-11-17 2-4 8-4 11 0 3-4 9-4 11 0 3 5-2 11-11 17z"
            fill="#f6ead9"
          />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
        }
      }
      <ellipse
        cx="47"
        cy="43"
        rx="8"
        ry="5"
        transform="rotate(-35 47 43)"
        fill="#fff"
        opacity="0.18"
      />
    </svg>
  `,
})
export class PlanetArt {
  readonly planet = input.required<PlanetId>();

  protected readonly shapes = SHAPES;
  protected readonly r = R;
  protected readonly ringedR = RINGED_R;
}
