import { Component, OnInit } from '@angular/core';
import { HistoryService } from './service/history.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  standalone: false,
})
export class HistoryComponent implements OnInit {
  constructor(private readonly historyService: HistoryService) {}

  ngOnInit(): void {
    this.historyService.initialize();
  }
}
