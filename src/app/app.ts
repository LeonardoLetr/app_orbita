import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="space-backdrop" aria-hidden="true"></div>
    <router-outlet />
  `,
})
export class App {}
