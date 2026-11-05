import { Component, OnInit } from '@angular/core';
import { AppContextService } from './core/services/app-context.service';
import { ApiError, toApiError } from './core/models/api-error.interface';
import { I18nService } from './core/services/i18n.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  loading = true;

  error: string | null = null;

  errorCode: string | null = null;

  constructor(
    private readonly context: AppContextService,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.context.initialize().subscribe({
      next: () => (this.loading = false),
      error: (error) => {
        this.loading = false;
        const apiError: ApiError = toApiError(error);
        this.error = apiError.message;
        this.errorCode = apiError.messageCode;
      },
    });
  }
}
