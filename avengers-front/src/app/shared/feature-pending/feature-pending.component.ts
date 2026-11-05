import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppCopyKey, I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-feature-pending',
  templateUrl: './feature-pending.component.html',
  styleUrls: ['./feature-pending.component.css'],
  standalone: false,
})
export class FeaturePendingComponent {
  constructor(
    private readonly route: ActivatedRoute,
    readonly i18n: I18nService,
  ) {}

  get title(): string {
    return this.i18n.t(this.route.snapshot.data['title'] as AppCopyKey);
  }

  get category(): string {
    return this.i18n.t(this.route.snapshot.data['category'] as AppCopyKey);
  }
}
