import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { AppContext } from '../models/app-context.interface';
import { responseData } from '../models/api-error.interface';
import { ApiService } from './api.service';
import { STANDARD_THEME, UiVisualsService } from './ui-visuals.service';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  private readonly subject = new BehaviorSubject<AppContext | null>(null);

  readonly context$ = this.subject.asObservable();

  constructor(
    private readonly api: ApiService,
    private readonly visuals: UiVisualsService,
  ) {}

  get current(): AppContext | null {
    return this.subject.value;
  }

  getCurrentLang(): 'es' | 'en' {
    return this.current?.language === 'es' ? 'es' : 'en';
  }

  initialize(): Observable<AppContext> {
    return this.reload();
  }

  reload(): Observable<AppContext> {
    return this.api.get<AppContext>('/context').pipe(
      map(responseData),
      tap((context) => this.publish(context)),
    );
  }

  private publish(context: AppContext): void {
    this.subject.next(context);
    this.visuals.apply(STANDARD_THEME);
  }
}
