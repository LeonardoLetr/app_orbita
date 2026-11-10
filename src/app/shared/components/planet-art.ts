import { Component, computed, input } from '@angular/core';
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

/** Bits of ice of the Oort Cloud: a loose shell of dots around the middle, always the same. */
function oortIce(): { x: number; y: number; r: number; opacity: number }[] {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 46 }, () => {
    const angle = next() * Math.PI * 2;
    const distance = 22 + next() * 32;
    return {
      x: Math.round((CENTER + Math.cos(angle) * distance) * 10) / 10,
      y: Math.round((CENTER + Math.sin(angle) * distance * 0.8) * 10) / 10,
      r: Math.round((0.8 + next() * 2.2) * 10) / 10,
      opacity: Math.round((0.45 + next() * 0.55) * 100) / 100,
    };
  });
}

/** Stops drawn as a lit ball, which get the shine on the top left. */
const BALLS = new Set<PlanetId>([
  'earth-orbit',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'eris',
]);

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
  oortIce: oortIce(),
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
        @case ('eris') {
          <circle cx="60" cy="60" [attr.r]="r" fill="#e3ebf5" />
          <path d="M40 50c7-6 17-4 19 3s-6 10-13 9-9-6-6-12z" fill="#c2d0e2" />
          <path d="M64 70c5-3 13-1 13 4s-7 7-12 5-5-6-1-9z" fill="#c2d0e2" />
          <circle cx="70" cy="44" r="4" fill="#f7fbff" />
          <path [attr.d]="shapes.shadow" fill="#060818" opacity="0.3" />
          <circle cx="104" cy="30" r="5" fill="#aab6c8" />
        }
        @case ('heliopause') {
          <!-- The edge of the Sun's bubble, with the Sun small and far behind it. -->
          <circle cx="24" cy="98" r="7" fill="#ffd23f" />
          <circle cx="24" cy="98" r="12" fill="#ffd23f" opacity="0.25" />
          <path
            d="M22 34A66 66 0 0 1 88 100"
            fill="none"
            stroke="#8b6bff"
            stroke-width="9"
            stroke-linecap="round"
            opacity="0.45"
          />
          <path
            d="M30 22A78 78 0 0 1 100 92"
            fill="none"
            stroke="#4fe0f5"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M44 14A88 88 0 0 1 108 78"
            fill="none"
            stroke="#eef0ff"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="1 7"
          />
          <circle cx="96" cy="30" r="2" fill="#eef0ff" />
          <circle cx="108" cy="50" r="1.5" fill="#eef0ff" opacity="0.7" />
          <circle cx="80" cy="16" r="1.5" fill="#eef0ff" opacity="0.7" />
        }
        @case ('voyager') {
          <g transform="rotate(-24 60 60)">
            <path d="M60 74 18 96" stroke="#9aa3c7" stroke-width="2.5" stroke-linecap="round" />
            <path d="M60 74 112 84" stroke="#9aa3c7" stroke-width="2" stroke-linecap="round" />
            <rect x="8" y="91" width="16" height="9" rx="3" fill="#6f78b3" />
            <rect x="106" y="80" width="9" height="8" rx="2" fill="#c9cfe6" />
            <rect x="49" y="68" width="22" height="13" rx="3" fill="#e0b13a" />
            <path d="M52 68 60 50 68 68z" fill="#9aa3c7" />
            <ellipse cx="60" cy="44" rx="30" ry="24" fill="#eef0ff" />
            <ellipse cx="60" cy="44" rx="21" ry="16" fill="#cfd5ea" />
            <circle cx="60" cy="44" r="4" fill="#6f78b3" />
          </g>
        }
        @case ('oort-cloud') {
          <ellipse
            cx="60"
            cy="60"
            rx="54"
            ry="44"
            fill="none"
            stroke="#9fd8ff"
            stroke-width="1"
            stroke-dasharray="2 5"
            opacity="0.5"
          />
          @for (ice of shapes.oortIce; track $index) {
            <circle
              [attr.cx]="ice.x"
              [attr.cy]="ice.y"
              [attr.r]="ice.r"
              [attr.opacity]="ice.opacity"
              fill="#cfeaff"
            />
          }
          <circle cx="60" cy="60" r="3" fill="#ffd23f" />
          <path d="M92 28 110 14" stroke="#cfeaff" stroke-width="2" stroke-linecap="round" />
          <circle cx="91" cy="29" r="4" fill="#f7fbff" />
        }
        @case ('proxima') {
          <circle cx="60" cy="60" r="50" fill="#ff5a3c" opacity="0.14" />
          <circle cx="60" cy="60" r="41" fill="#ff5a3c" opacity="0.28" />
          <circle cx="60" cy="60" [attr.r]="r" fill="#ff6a3d" />
          <path d="M40 52c6-7 18-6 21 1s-5 11-13 10-11-5-8-11z" fill="#ff9a55" />
          <path d="M62 72c5-4 14-2 15 3s-6 8-12 6-6-6-3-9z" fill="#ff9a55" />
          <circle cx="72" cy="48" r="5" fill="#c9391f" />
          <circle cx="50" cy="74" r="3.5" fill="#c9391f" />
          <path
            d="M86 30c8-2 14 4 12 12"
            fill="none"
            stroke="#ffb36b"
            stroke-width="3"
            stroke-linecap="round"
          />
        }
      }
      @if (ball()) {
        <ellipse
          cx="47"
          cy="43"
          rx="8"
          ry="5"
          transform="rotate(-35 47 43)"
          fill="#fff"
          opacity="0.18"
        />
      }
    </svg>
  `,
})
export class PlanetArt {
  readonly planet = input.required<PlanetId>();

  protected readonly shapes = SHAPES;
  protected readonly ball = computed(() => BALLS.has(this.planet()));
  protected readonly r = R;
  protected readonly ringedR = RINGED_R;
}
