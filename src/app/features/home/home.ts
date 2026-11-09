import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLANETS } from '../../core/data/planets';
import { RARITIES } from '../../core/models/rarity';
import { GameService, SECONDS_PER_CATEGORY } from '../../core/services/game-service';
import { ProgressService } from '../../core/services/progress-service';
import { RARITY_POINTS } from '../../core/services/scoring-service';
import { SoundService } from '../../core/services/sound-service';
import { PlanetArt } from '../../shared/components/planet-art';
import { RARITY_LABELS } from '../../shared/components/rarity-badge';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlanetArt],
  templateUrl: './home.html',
})
export class Home {
  protected readonly game = inject(GameService);
  protected readonly progress = inject(ProgressService);
  protected readonly sound = inject(SoundService);
  protected readonly secondsPerCategory = SECONDS_PER_CATEGORY;
  protected readonly planets = PLANETS;
  /** The scoring levels, from the most common answers to the rarest. */
  protected readonly levels = RARITIES.map((rarity) => ({
    rarity,
    label: RARITY_LABELS[rarity],
    points: RARITY_POINTS[rarity],
    style: `border-${rarity}/40 bg-${rarity}/10 text-${rarity}`,
  }));
}
