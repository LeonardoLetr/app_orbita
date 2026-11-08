import { Component, inject, resource } from '@angular/core';
import { CategoryRepository } from '../../core/data/category-repository';

/** Temporary landing screen until the game screen exists. */
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly repository = inject(CategoryRepository);

  protected readonly categories = resource({ loader: () => this.repository.getAll() });
}
