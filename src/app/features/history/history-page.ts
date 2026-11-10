import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { modeLabel } from '../../core/data/game-modes';
import { PLANETS } from '../../core/data/planets';
import { MAX_SAVED_ROUNDS } from '../../core/data/local-progress-repository';
import { PlanetId } from '../../core/models/planet';
import { ProgressService } from '../../core/services/progress-service';
import { PlanetArt } from '../../shared/components/planet-art';
import { RarityBadge } from '../../shared/components/rarity-badge';

const PLANET_NAMES = new Map(PLANETS.map((planet) => [planet.id, planet.name]));
const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const FULL_DATE = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** List of past rounds saved on this device, with each answer. */
@Component({
  selector: 'app-history-page',
  imports: [RouterLink, PlanetArt, RarityBadge],
  templateUrl: './history-page.html',
})
export class HistoryPage {
  protected readonly progress = inject(ProgressService);
  protected readonly maxSavedRounds = MAX_SAVED_ROUNDS;
  protected readonly modeLabel = modeLabel;

  protected planetName(id: PlanetId): string {
    return PLANET_NAMES.get(id) ?? '';
  }

  /** Short date for this year's rounds ("08/11, 21:24"), with the year for older ones. */
  protected formatDate(iso: string): string {
    const date = new Date(iso);
    const format = date.getFullYear() === new Date().getFullYear() ? SHORT_DATE : FULL_DATE;
    return format.format(date);
  }

  protected async clear(): Promise<void> {
    if (confirm('Apagar todo o histórico, o recorde e os destinos alcançados?')) {
      await this.progress.clear();
    }
  }
}
