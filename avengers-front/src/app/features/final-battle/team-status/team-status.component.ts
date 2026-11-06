import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

import { TeamStatusService, TeamStatusResponse } from './service/team-status.service';

@Component({
  selector: 'app-team-status',
  templateUrl: './team-status.component.html',
  styleUrls: ['./team-status.component.css'],
  standalone: false,
})
export class TeamStatusComponent implements OnInit, OnDestroy {
  statusData: TeamStatusResponse['data'] | null = null;

  loading = true;

  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly teamStatusService: TeamStatusService) {}

  ngOnInit(): void {
    timer(0, 2000)
      .pipe(
        switchMap(() =>
          this.teamStatusService.getStatus().pipe(
            catchError((error) => {
              console.error('Error al consultar el estado de los equipos:', error);

              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (response === null) {
          this.errorMessage =
            'No se pudo conectar con el servidor. Verificá que el backend esté funcionando.';
          this.loading = false;
          return;
        }

        if (response.success) {
          this.statusData = response.data;
          this.errorMessage = '';
        } else {
          this.errorMessage =
            response.responseMessage?.message || 'No se pudo obtener el estado de los equipos.';
        }

        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
