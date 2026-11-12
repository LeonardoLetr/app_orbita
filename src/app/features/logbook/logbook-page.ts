import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RARITY_LABELS } from '../../shared/components/rarity-badge';
import { Logbook } from './logbook';

/** The logbook: every category, with how much of it the player has found. */
@Component({
  selector: 'app-logbook-page',
  imports: [RouterLink],
  templateUrl: './logbook-page.html',
})
export class LogbookPage {
  protected readonly logbook = inject(Logbook);
  protected readonly labels = RARITY_LABELS;

  /** Thousands the way they are written in Brazil: 6.365. */
  protected count(value: number): string {
    return value.toLocaleString('pt-BR');
  }
}
