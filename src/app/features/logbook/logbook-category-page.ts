import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Rarity } from '../../core/models/rarity';
import { RARITY_LABELS } from '../../shared/components/rarity-badge';
import { Logbook } from './logbook';

/** More than one of a rarity, as it is said of what is still missing. */
const PLURALS: Record<Rarity, string> = {
  satellite: 'Satélites',
  meteorite: 'Meteoritos',
  comet: 'Cometas',
  pulsar: 'Pulsares',
  supernova: 'Supernovas',
};

/**
 * One category of the logbook: the answers the player has found, by rarity. What is
 * missing shows only as a number.
 */
@Component({
  selector: 'app-logbook-category-page',
  imports: [RouterLink],
  templateUrl: './logbook-category-page.html',
})
export class LogbookCategoryPage {
  protected readonly logbook = inject(Logbook);
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))),
  );
  protected readonly item = computed(() =>
    this.logbook.categories().find((candidate) => candidate.category.id === this.id()),
  );
  protected readonly labels = RARITY_LABELS;

  /** "falta 1 Supernova", "faltam 9 Supernovas". */
  protected missing(rarity: Rarity, count: number): string {
    return count === 1 ? `falta 1 ${RARITY_LABELS[rarity]}` : `faltam ${count} ${PLURALS[rarity]}`;
  }
}
