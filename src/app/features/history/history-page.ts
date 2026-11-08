import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLANETS } from '../../core/data/planets';
import { MAX_SAVED_ROUNDS } from '../../core/data/local-progress-repository';
import { PlanetId } from '../../core/models/planet';
import { ProgressService } from '../../core/services/progress-service';
import { PlanetArt } from '../../shared/components/planet-art';
import { RarityBadge } from '../../shared/components/rarity-badge';

const PLANET_NAMES = new Map(PLANETS.map((planet) => [planet.id, planet.name]));
const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** List of past rounds saved on this device, with each answer. */
@Component({
  selector: 'app-history-page',
  imports: [RouterLink, PlanetArt, RarityBadge],
  templateUrl: './history-page.html',
})
export class HistoryPage {
  protected readonly progress = inject(ProgressService);
  protected readonly maxSavedRounds = MAX_SAVED_ROUNDS;

  protected planetName(id: PlanetId): string {
    return PLANET_NAMES.get(id) ?? '';
  }

  protected formatDate(iso: string): string {
    return DATE_FORMAT.format(new Date(iso));
  }

  protected async clear(): Promise<void> {
    if (confirm('Apagar todo o histórico, o recorde e os destinos alcançados?')) {
      await this.progress.clear();
    }
  }
}
