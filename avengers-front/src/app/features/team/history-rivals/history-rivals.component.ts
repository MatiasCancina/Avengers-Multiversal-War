import { Component, OnInit } from '@angular/core';
import { HistoryRivalsService } from './service/history-rivals.service';
import { HeroArtworkResolverService } from '../../../core/services/hero-artwork-resolver.service';

@Component({
  selector: 'app-history-rivals',
  templateUrl: './history-rivals.component.html',
  styleUrls: ['./history-rivals.component.css'],
  standalone: false,
})
export class HistoryRivalsComponent implements OnInit {
  constructor(
    public readonly feature: HistoryRivalsService,
    public readonly artwork: HeroArtworkResolverService,
  ) {}

  get state() {
    return this.feature.state;
  }

  ngOnInit(): void {
    this.feature.initialize();
  }

  retry(): void {
    this.feature.initialize();
  }

  winnerName(
    id: string | null,
    match: { teamA: { id: string; name: string }; teamB: { id: string; name: string } },
  ): string {
    if (!id) {
      return 'Pendiente / sin ganador publicado';
    }

    return id === match.teamA.id ? match.teamA.name : id === match.teamB.id ? match.teamB.name : id;
  }
}
