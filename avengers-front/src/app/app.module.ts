import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppHeaderComponent } from './shared/layout/app-header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FeaturePendingComponent } from './shared/feature-pending/feature-pending.component';
import { TeamConfigComponent } from './features/team/team-config/team-config.component';
import { HistoryRivalsComponent } from './features/team/history-rivals/history-rivals.component';
import { HeroRosterComponent } from './features/team/hero-roster/hero-roster.component';
import { SimulateJourneyComponent } from './features/journey/simulate-journey/simulate-journey.component';
import { GroupStageComponent } from './features/journey/group-stage/group-stage.component';
import { KnockoutStageComponent } from './features/journey/knockout-stage/knockout-stage.component';
import { LoadingStateComponent } from './shared/state/loading-state.component';
import { ErrorStateComponent } from './shared/state/error-state.component';
import { EmptyStateComponent } from './shared/state/empty-state.component';
import { NarrativeRendererComponent } from './shared/narrative/narrative-renderer.component';
import { TeamJourneyComponent } from './features/journey/team-journey/team-journey.component';
import { FinalPreparationComponent } from './features/final-battle/final-preparation/final-preparation.component';
import { FinalBattleComponent } from './features/final-battle/final-battle/final-battle.component';
import { LiveEventsComponent } from './features/final-battle/live-events/live-events.component';
import { TeamStatusComponent } from './features/final-battle/team-status/team-status.component';
import { AwardsComponent } from './features/results/awards/awards.component';
import { HistoryComponent } from './features/results/history/history.component';

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    SidebarComponent,
    FeaturePendingComponent,
    TeamConfigComponent,
    HistoryRivalsComponent,
    HeroRosterComponent,
    SimulateJourneyComponent,
    GroupStageComponent,
    KnockoutStageComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    NarrativeRendererComponent,
    TeamJourneyComponent,
    FinalPreparationComponent,
    FinalBattleComponent,
    LiveEventsComponent,
    TeamStatusComponent,
    AwardsComponent,
    HistoryComponent,
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
