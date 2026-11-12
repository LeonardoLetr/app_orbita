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
import { discoveryKey } from '../../core/utils/discoveries';
import { RouterLink } from '@angular/router';
import { CLASSIC_MODE, THEME_MODE, isMainMode, modeLink } from '../../core/data/game-modes';
import { GameMode } from '../../core/models/game-mode';
import { RoundEntry } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { ScoringService } from '../../core/services/scoring-service';
import { rankFor } from '../../core/utils/ranks';
import { RankBadge } from '../../shared/components/rank-badge';
import { RarityBadge } from '../../shared/components/rarity-badge';
import { StarBurst } from '../../shared/components/star-burst';
import { OrbitArrival } from './orbit-arrival';
import { ScoreHistory } from './score-history';
import { shareText } from './share-text';

/** Answers after this one come in together, so a long list does not keep the player waiting. */
const STAGGERED_ROWS = 10;
/** A longer list of answers starts folded, showing this many. */
const FOLDED_ROWS = 10;

/** End-of-round screen: arrival at the destination, points, recent rounds and every answer. */
@Component({
  selector: 'app-result',
  imports: [RouterLink, RarityBadge, RankBadge, StarBurst, OrbitArrival, ScoreHistory],
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
  /** Letter of the round, where one was drawn. */
  readonly letter = input<string>();
  readonly playAgain = output<void>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly destination = computed(() =>
    this.scoring.destinationFor(this.points(), this.mode().rules.route),
  );
  /** "a" or "à", taken from the destination's name ("a Saturno", "à Lua"). */
  protected readonly preposition = computed(() => this.destination().toName.split(' ')[0]);
  protected readonly next = computed(() =>
    this.scoring.nextDestination(this.points(), this.mode().rules.route),
  );

  /** The round just played, once it is saved. */
  protected readonly currentId = computed(() =>
    this.progress.lastOutcome() ? this.progress.rounds()[0]?.id : undefined,
  );
  /** Name of the mode, said only for rounds outside the main one. */
  protected readonly modeName = computed(() => {
    const mode = this.mode();
    if (mode.theme) {
      return `Tema ${mode.theme.name}`;
    }
    if (this.letter()) {
      return `Letra ${this.letter()}`;
    }
    return isMainMode(mode) ? '' : mode.name;
  });
  /** The same on the badge above the destination: "Modo Relâmpago", "Tema Natureza". */
  protected readonly modeBadge = computed(() =>
    this.mode().theme || this.letter() || !this.modeName()
      ? this.modeName()
      : `Modo ${this.modeName()}`,
  );
  /** Where another theme can be picked, after a round played by theme. */
  protected readonly themesLink = computed(() =>
    this.mode().theme ? modeLink(THEME_MODE) : undefined,
  );
  /** Saved rounds of this mode, newest first. */
  protected readonly modeRounds = computed(() =>
    this.progress.rounds().filter((round) => round.mode === this.mode().id),
  );
  protected readonly hasHistory = computed(() => this.modeRounds().length > 1);
  protected readonly best = computed(() => this.progress.bestFor(this.mode().id));
  /** For rounds with no fixed number of categories: how many answers fit in the clock or in the lives. */
  protected readonly pace = computed(() => {
    const { clock, lives } = this.mode().rules;
    const answers = this.entries().filter((entry) => entry.result?.match).length;
    const count = `${answers} ${answers === 1 ? 'resposta' : 'respostas'}`;
    if (lives !== undefined) {
      return `${count} antes de perder as ${lives} vidas`;
    }
    return clock.scope === 'round' ? `${count} em ${clock.seconds} segundos` : '';
  });

  /** Each answer plus a few rare ones the player could have given instead. */
  protected readonly rows = computed(() => {
    const found = new Set(
      (this.progress.lastOutcome()?.discoveries ?? []).map(
        ({ categoryId, key }) => `${categoryId}/${key}`,
      ),
    );
    /** An answer given twice in a round is only new the first time. */
    const shown = new Set<string>();
    return this.entries().map((entry, index) => {
      const result = entry.result;
      const id = result?.match && `${entry.category.id}/${discoveryKey(result.match.text)}`;
      /** Scored for the first time ever: it has just gone into the logbook. */
      const isNew = !!id && found.has(id) && !shown.has(id);
      if (id) {
        shown.add(id);
      }
      const counted =
        result?.match && result.match.text.toLowerCase() !== result.input.toLowerCase()
          ? result.match.text
          : undefined;
      return {
        entry,
        counted,
        isNew,
        /** When the row comes in, in seconds. */
        delay: 2.5 + Math.min(index, STAGGERED_ROWS) * 0.08,
        ideas: this.scoring
          .rarestAnswers(entry.category, 3, result?.match, this.letter())
          .map((answer) => answer.text),
      };
    });
  });

  protected readonly newCount = computed(() => this.rows().filter((row) => row.isNew).length);

  /** A long list starts folded, so the buttons below it stay within reach. */
  protected readonly unfolded = signal(false);
  protected readonly shownRows = computed(() =>
    this.unfolded() || this.rows().length <= FOLDED_ROWS + 2
      ? this.rows()
      : this.rows().slice(0, FOLDED_ROWS),
  );

  /** Experience of the round and where it left the player in the career. */
  protected readonly career = computed(() => {
    const outcome = this.progress.lastOutcome();
    if (!outcome) {
      return undefined;
    }
    const standing = this.progress.standing();
    const before = rankFor(this.progress.xp() - outcome.xpGained);
    return {
      gained: outcome.xpGained,
      standing,
      rankUp: outcome.rankUp,
      // The bar fills from where it was, or from empty after moving up a rank.
      from: Math.round((outcome.rankUp ? 0 : before.progress) * 100),
      to: Math.round(standing.progress * 100),
    };
  });

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
