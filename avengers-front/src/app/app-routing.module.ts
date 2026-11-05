import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeamConfigComponent } from './features/team/team-config/team-config.component';
import { HistoryRivalsComponent } from './features/team/history-rivals/history-rivals.component';
import { HeroRosterComponent } from './features/team/hero-roster/hero-roster.component';
import { SimulateJourneyComponent } from './features/journey/simulate-journey/simulate-journey.component';
import { GroupStageComponent } from './features/journey/group-stage/group-stage.component';
import { KnockoutStageComponent } from './features/journey/knockout-stage/knockout-stage.component';
import { TeamJourneyComponent } from './features/journey/team-journey/team-journey.component';
import { FinalPreparationComponent } from './features/final-battle/final-preparation/final-preparation.component';
import { FinalBattleComponent } from './features/final-battle/final-battle/final-battle.component';
import { LiveEventsComponent } from './features/final-battle/live-events/live-events.component';
import { TeamStatusComponent } from './features/final-battle/team-status/team-status.component';
import { AwardsComponent } from './features/results/awards/awards.component';
import { HistoryComponent } from './features/results/history/history.component';
import { APP_ROUTE_METADATA } from './core/constants/app-routes';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'my-team/heroes' },
  {
    path: 'my-team/configuration',
    component: TeamConfigComponent,
    data: APP_ROUTE_METADATA.teamConfig,
  },
  {
    path: 'my-team/history-rivals',
    component: HistoryRivalsComponent,
    data: APP_ROUTE_METADATA.historyRivals,
  },
  { path: 'my-team/heroes', component: HeroRosterComponent, data: APP_ROUTE_METADATA.heroRoster },
  {
    path: 'journey/simulate',
    component: SimulateJourneyComponent,
    data: APP_ROUTE_METADATA.simulateJourney,
  },
  {
    path: 'journey/group-stage',
    component: GroupStageComponent,
    data: APP_ROUTE_METADATA.groupStage,
  },
  {
    path: 'journey/knockout-stage',
    component: KnockoutStageComponent,
    data: APP_ROUTE_METADATA.knockoutStage,
  },
  { path: 'journey/team', component: TeamJourneyComponent, data: APP_ROUTE_METADATA.teamJourney },
  {
    path: 'final-stage/preparation',
    component: FinalPreparationComponent,
    data: APP_ROUTE_METADATA.finalPreparation,
  },
  {
    path: 'final-stage/play',
    component: FinalBattleComponent,
    data: APP_ROUTE_METADATA.finalBattle,
  },
  {
    path: 'final-stage/events',
    component: LiveEventsComponent,
    data: APP_ROUTE_METADATA.liveEvents,
  },
  {
    path: 'final-stage/status',
    component: TeamStatusComponent,
    data: APP_ROUTE_METADATA.teamStatus,
  },
  { path: 'results/awards', component: AwardsComponent, data: APP_ROUTE_METADATA.awards },
  { path: 'results/history', component: HistoryComponent, data: APP_ROUTE_METADATA.history },
  {
    path: 'results/history/:attemptId',
    component: HistoryComponent,
    data: APP_ROUTE_METADATA.historyDetail,
  },
  { path: '**', redirectTo: 'my-team/heroes' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
