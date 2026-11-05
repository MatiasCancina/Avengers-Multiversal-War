import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: '<p class="state-card" role="status" aria-live="polite">{{ message }}</p>',
  standalone: false,
})
export class LoadingStateComponent {
  @Input() message = 'Loading…';
}
