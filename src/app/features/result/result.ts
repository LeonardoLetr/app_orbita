import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { PlanetArt } from '../../shared/components/planet-art';
import { RarityBadge } from '../../shared/components/rarity-badge';
import { StarBurst } from '../../shared/components/star-burst';
import { JourneyTrack } from './journey-track';

/** End-of-round screen: planet reached, journey animation and every answer. */
@Component({
  selector: 'app-result',
  imports: [RouterLink, PlanetArt, RarityBadge, JourneyTrack, StarBurst],
  templateUrl: './result.html',
})
export class Result {
  private readonly scoring = inject(ScoringService);
  protected readonly progress = inject(ProgressService);

  readonly entries = input.required<RoundEntry[]>();
  readonly points = input.required<number>();
  readonly playAgain = output<void>();

  protected readonly destination = computed(() => this.scoring.destinationFor(this.points()));
  protected readonly next = computed(() => this.scoring.nextDestination(this.points()));

  /** Each answer plus a few rare ones the player could have given instead. */
  protected readonly rows = computed(() =>
    this.entries().map((entry) => ({
      entry,
      ideas: this.scoring
        .rarestAnswers(entry.category, 3, entry.result?.match)
        .map((answer) => answer.text),
    })),
  );
}
