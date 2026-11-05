import { Component } from '@angular/core';
import { AppContextService } from '../../core/services/app-context.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
  standalone: false,
})
export class AppHeaderComponent {
  constructor(
    readonly context: AppContextService,
    readonly i18n: I18nService,
  ) {}
}
