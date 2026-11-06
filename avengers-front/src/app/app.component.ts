import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppContextService } from './core/services/app-context.service';
import { ApiError, toApiError } from './core/models/api-error.interface';
import { I18nService } from './core/services/i18n.service';

const BACKEND_WAKEUP_NOTICE_DELAY_MS = 2500;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnDestroy, OnInit {
  loading = true;

  showBackendWakeupNotice = false;

  error: string | null = null;

  errorCode: string | null = null;

  private wakeupNoticeTimer: number | null = null;

  constructor(
    private readonly context: AppContextService,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    const forceWakeupNotice =
      new URLSearchParams(window.location.search).get('showBackendWakeupNotice') === 'true';

    if (forceWakeupNotice) {
      this.showBackendWakeupNotice = true;
    } else {
      this.wakeupNoticeTimer = window.setTimeout(
        () => (this.showBackendWakeupNotice = true),
        BACKEND_WAKEUP_NOTICE_DELAY_MS,
      );
    }

    this.context.initialize().subscribe({
      next: () => {
        this.clearWakeupNoticeTimer();
        this.loading = false;
        if (!forceWakeupNotice) {
          this.showBackendWakeupNotice = false;
        }
      },
      error: (error) => {
        this.clearWakeupNoticeTimer();
        this.loading = false;
        if (!forceWakeupNotice) {
          this.showBackendWakeupNotice = false;
        }
        const apiError: ApiError = toApiError(error);
        this.error = apiError.message;
        this.errorCode = apiError.messageCode;
      },
    });
  }

  ngOnDestroy(): void {
    this.clearWakeupNoticeTimer();
  }

  dismissBackendWakeupNotice(): void {
    this.showBackendWakeupNotice = false;
  }

  private clearWakeupNoticeTimer(): void {
    if (this.wakeupNoticeTimer !== null) {
      window.clearTimeout(this.wakeupNoticeTimer);
      this.wakeupNoticeTimer = null;
    }
  }
}
