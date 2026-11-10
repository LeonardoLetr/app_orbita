import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAME_MODES, isMainMode } from '../../core/data/game-modes';
import { PLANETS } from '../../core/data/planets';
import { ProgressService } from '../../core/services/progress-service';
import { MusicService } from '../../core/services/music-service';
import { SoundService } from '../../core/services/sound-service';
import { PlanetArt } from '../../shared/components/planet-art';
import { ModePicker } from './mode-picker';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlanetArt, ModePicker],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly progress = inject(ProgressService);
  protected readonly sound = inject(SoundService);
  protected readonly music = inject(MusicService);
  protected readonly planets = PLANETS;
  /** Stops of the classic route already reached; the ones beyond it are not counted here. */
  protected readonly reachedCount = computed(
    () => PLANETS.filter((planet) => this.progress.reachedPlanets().has(planet.id)).length,
  );
  /** The main mode starts with the big button; the others are offered below it. */
  protected readonly otherModes = GAME_MODES.filter((mode) => !isMainMode(mode));
}
