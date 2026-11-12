import { Injectable, computed, inject, signal } from '@angular/core';
import { CategoryRepository } from '../../core/data/category-repository';
import { Answer, Category } from '../../core/models/category';
import { RARITIES, Rarity } from '../../core/models/rarity';
import { ProgressService } from '../../core/services/progress-service';
import { discoveryKey } from '../../core/utils/discoveries';

/** How much of one rarity of a category the player has found. */
export interface RarityPage {
  rarity: Rarity;
  /** Answers already given, in alphabetical order. */
  found: Answer[];
  total: number;
}

/** A category as the logbook shows it. */
export interface LogbookCategory {
  category: Category;
  found: number;
  total: number;
  byRarity: RarityPage[];
}

const byText = new Intl.Collator('pt-BR').compare;

/**
 * The logbook: the answers of the base the player has already given, by category and
 * rarity. Answers not found yet are only ever counted, never listed.
 */
@Injectable({ providedIn: 'root' })
export class Logbook {
  private readonly progress = inject(ProgressService);
  private readonly all = signal<Category[] | undefined>(undefined);
  private readonly failed = signal(false);

  /** `loading` until the base arrives, `error` when it cannot be read. */
  readonly status = computed(() => (this.failed() ? 'error' : this.all() ? 'ready' : 'loading'));

  readonly categories = computed<LogbookCategory[]>(() => {
    const discoveries = this.progress.discoveries();
    return (this.all() ?? []).map((category) => {
      const known = discoveries[category.id] ?? {};
      const byRarity = RARITIES.map((rarity) => {
        const answers = category.answers.filter((answer) => answer.rarity === rarity);
        return {
          rarity,
          total: answers.length,
          found: answers
            .filter((answer) => discoveryKey(answer.text) in known)
            .sort((a, b) => byText(a.text, b.text)),
        };
      });
      return {
        category,
        byRarity,
        total: category.answers.length,
        found: byRarity.reduce((sum, page) => sum + page.found.length, 0),
      };
    });
  });

  /** Answers found that are still in the base, and how many the base has. */
  readonly found = computed(() => this.categories().reduce((sum, item) => sum + item.found, 0));
  readonly total = computed(() => this.categories().reduce((sum, item) => sum + item.total, 0));

  constructor() {
    inject(CategoryRepository)
      .getAll()
      .then((categories) => this.all.set(categories))
      .catch(() => this.failed.set(true));
  }
}
