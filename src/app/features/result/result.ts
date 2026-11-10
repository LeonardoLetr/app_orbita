import {
  Component,
  DOCUMENT,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CLASSIC_MODE, isMainMode } from '../../core/data/game-modes';
import { GameMode } from '../../core/models/game-mode';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { RarityBadge } from '../../shared/components/rarity-badge';
import { StarBurst } from '../../shared/components/star-burst';
import { OrbitArrival } from './orbit-arrival';
import { ScoreHistory } from './score-history';
import { shareText } from './share-text';

/** End-of-round screen: arrival at the destination, points, recent rounds and every answer. */
@Component({
  selector: 'app-result',
  imports: [RouterLink, RarityBadge, StarBurst, OrbitArrival, ScoreHistory],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result {
  private readonly scoring = inject(ScoringService);
  private readonly document = inject(DOCUMENT);
  protected readonly progress = inject(ProgressService);

  readonly entries = input.required<RoundEntry[]>();
  readonly points = input.required<number>();
  /** Mode of the round: records and the chart only compare rounds of the same mode. */
  readonly mode = input<GameMode>(CLASSIC_MODE);
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
  /** Name of the mode, said only for rounds outside the main one. */
  protected readonly modeName = computed(() => (isMainMode(this.mode()) ? '' : this.mode().name));
  /** Saved rounds of this mode, newest first. */
  protected readonly modeRounds = computed(() =>
    this.progress.rounds().filter((round) => round.mode === this.mode().id),
  );
  protected readonly hasHistory = computed(() => this.modeRounds().length > 1);
  protected readonly best = computed(() => this.progress.bestFor(this.mode().id));

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

  protected readonly canShare =
    typeof navigator !== 'undefined' && (!!navigator.share || !!navigator.clipboard);
  protected readonly copied = signal(false);

  constructor() {
    // The answer field disappears when the round ends; move focus to the result instead.
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  protected async share(): Promise<void> {
    const text = shareText(
      this.destination(),
      this.points(),
      this.entries().map((entry) => entry.result),
      this.document.baseURI,
      this.modeName(),
    );
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch {
      // Sharing was cancelled or blocked: nothing to do.
    }
  }
}
