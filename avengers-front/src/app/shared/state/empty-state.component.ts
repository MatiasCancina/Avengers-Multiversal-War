import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: '<p class="state-card" role="status">{{ message }}</p>',
  standalone: false,
})
export class EmptyStateComponent {
  @Input() message = 'No records available.';
}
