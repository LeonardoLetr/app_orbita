import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLANETS } from '../../core/data/planets';
import { ProgressService } from '../../core/services/progress-service';
import { MusicService } from '../../core/services/music-service';
import { SoundService } from '../../core/services/sound-service';
import { PlanetArt } from '../../shared/components/planet-art';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PlanetArt],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly progress = inject(ProgressService);
  protected readonly sound = inject(SoundService);
  protected readonly music = inject(MusicService);
  protected readonly planets = PLANETS;
}
