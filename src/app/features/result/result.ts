import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { RarityBadge } from '../../shared/components/rarity-badge';
import { StarBurst } from '../../shared/components/star-burst';
import { OrbitArrival } from './orbit-arrival';
import { ScoreHistory } from './score-history';

/** End-of-round screen: arrival at the destination, points, recent rounds and every answer. */
@Component({
  selector: 'app-result',
  imports: [RouterLink, RarityBadge, StarBurst, OrbitArrival, ScoreHistory],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result {
  private readonly scoring = inject(ScoringService);
  protected readonly progress = inject(ProgressService);

  readonly entries = input.required<RoundEntry[]>();
  readonly points = input.required<number>();
  readonly playAgain = output<void>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly destination = computed(() => this.scoring.destinationFor(this.points()));
  /** "a" or "à", taken from the destination's name ("a Saturno", "à Lua"). */
  protected readonly preposition = computed(() => this.destination().toName.split(' ')[0]);
  protected readonly next = computed(() => this.scoring.nextDestination(this.points()));

  /** The round just played, once it is saved. */
  protected readonly currentId = computed(() =>
    this.progress.lastOutcome() ? this.progress.rounds()[0]?.id : undefined,
  );
  protected readonly hasHistory = computed(() => this.progress.rounds().length > 1);

  /** Each answer plus a few rare ones the player could have given instead. */
  protected readonly rows = computed(() =>
    this.entries().map((entry) => {
      const result = entry.result;
      const counted =
        result?.match && result.match.text.toLowerCase() !== result.input.toLowerCase()
          ? result.match.text
          : undefined;
      return {
        entry,
        counted,
        ideas: this.scoring
          .rarestAnswers(entry.category, 3, result?.match)
          .map((answer) => answer.text),
      };
    }),
  );

  constructor() {
    // The answer field disappears when the round ends; move focus to the result instead.
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
