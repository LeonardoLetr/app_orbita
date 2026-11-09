import { Component, input } from '@angular/core';
import { PlanetId } from '../../core/models/planet';
import { PlanetArt } from '../../shared/components/planet-art';
import { RocketShape } from '../../shared/components/rocket-shape';

let nextId = 0;

/** Path the rocket flies in on, ending where the orbit starts (left side, heading down). */
const APPROACH = 'M 14 8 C 60 28 0 70 20 118';
/** Orbit around the planet, wide enough to never cross it. */
const ORBIT = 'M 20 118 A 140 84 0 1 0 300 118 A 140 84 0 1 0 20 118';
/** Pace of the approach: fast at first, gently slowing down into orbit. */
const APPROACH_EASING = '0.2 0.6 0.35 1';

/**
 * The destination planet with the rocket arriving along a dashed path and then
 * circling it. Decorative: the result title already says where the rocket got.
 */
@Component({
  selector: 'app-orbit-arrival',
  imports: [PlanetArt, RocketShape],
  host: { class: 'relative block aspect-[320/236]', 'aria-hidden': 'true' },
  template: `
    <app-planet-art class="planet absolute top-1/2 left-1/2 w-[62%]" [planet]="planet()" />
    <svg viewBox="0 0 320 236" class="absolute inset-0 size-full overflow-visible">
      <!-- The dashed trail is drawn behind the rocket as it flies in. -->
      <mask [attr.id]="trailId" maskUnits="userSpaceOnUse" x="-20" y="-20" width="360" height="276">
        <path
          [attr.d]="approach"
          pathLength="100"
          class="fill-none stroke-white"
          stroke-width="8"
          stroke-dasharray="100 100"
        >
          @if (moving) {
            <animate
              attributeName="stroke-dashoffset"
              values="100;0"
              dur="1.6s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              [attr.keySplines]="easing"
            />
          }
        </path>
      </mask>
      <ellipse
        cx="160"
        cy="118"
        rx="140"
        ry="84"
        class="fill-none stroke-space-400/50"
        stroke-width="1.5"
        stroke-dasharray="3 6"
      />
      <path
        [attr.d]="approach"
        [attr.mask]="'url(#' + trailId + ')'"
        class="fill-none stroke-flare-400/70"
        stroke-width="2"
        stroke-dasharray="5 6"
      />
      <g>
        <g appRocketShape [boosting]="true" transform="translate(-16 -9) scale(0.5)"></g>
        @if (moving) {
          <animate attributeName="opacity" values="0;1" dur="0.3s" fill="freeze" />
          <animateMotion
            [attr.id]="approachId"
            [attr.path]="approach"
            dur="1.6s"
            begin="0s"
            fill="freeze"
            rotate="auto"
            calcMode="spline"
            keyTimes="0;1"
            [attr.keySplines]="easing"
          />
          <animateMotion
            [attr.path]="orbit"
            [attr.begin]="approachId + '.end'"
            dur="9s"
            repeatCount="indefinite"
            rotate="auto"
          />
        } @else {
          <animateMotion
            [attr.path]="orbit"
            dur="1s"
            keyPoints="0.25;0.25"
            keyTimes="0;1"
            fill="freeze"
            rotate="auto"
          />
        }
      </g>
    </svg>
  `,
  styles: `
    .planet {
      translate: -50% -50%;
      filter: drop-shadow(0 0 1.5rem rgb(169 139 255 / 0.35));
    }

    @media (prefers-reduced-motion: no-preference) {
      .planet {
        animation: planet-arrive 700ms cubic-bezier(0.2, 0.8, 0.3, 1) both;
      }
    }

    @keyframes planet-arrive {
      from {
        opacity: 0;
        translate: -50% -90%;
        scale: 0.8;
      }
    }
  `,
})
export class OrbitArrival {
  readonly planet = input.required<PlanetId>();

  protected readonly approach = APPROACH;
  protected readonly orbit = ORBIT;
  protected readonly easing = APPROACH_EASING;
  protected readonly approachId = `orbit-approach-${nextId}`;
  protected readonly trailId = `orbit-trail-${nextId++}`;
  /** With reduced motion the rocket waits in orbit instead of flying in. */
  protected readonly moving = !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
