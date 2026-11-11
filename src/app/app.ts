import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppInstall } from './core/services/app-install';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="space-backdrop" aria-hidden="true"></div>
    <router-outlet />
  `,
})
export class App {
  constructor() {
    // Created with the page, so the browser's offer to install is not missed.
    inject(AppInstall);
  }
}
