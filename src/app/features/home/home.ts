import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService, SECONDS_PER_CATEGORY } from '../../core/services/game-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  protected readonly game = inject(GameService);
  protected readonly secondsPerCategory = SECONDS_PER_CATEGORY;
}
