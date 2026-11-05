import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template:
    '<p class="state-card error" role="alert">{{ message }}<small *ngIf="messageCode">{{ messageCode }}</small></p>',
  standalone: false,
})
export class ErrorStateComponent {
  @Input() message = 'Unable to complete this request.';

  @Input() messageCode: string | null = null;
}
