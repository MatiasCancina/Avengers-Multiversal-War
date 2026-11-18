import { Component, OnInit } from '@angular/core';
import { AwardsService } from './service/awards.service';
import { AwardsViewModel } from './service/awards-view-model.interface';

@Component({
  selector: 'app-awards',
  templateUrl: './awards.component.html',
  styleUrls: ['./awards.component.css'],
  standalone: false,
})
export class AwardsComponent implements OnInit {
  constructor(private readonly awardsService: AwardsService) {}

  get pageState(): AwardsViewModel {
    return this.awardsService.getViewModel();
  }

  ngOnInit(): void {
    this.awardsService.initialize();
  }
}
