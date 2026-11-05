import { Component, OnInit } from '@angular/core';
import { AwardsService } from './service/awards.service';

@Component({
  selector: 'app-awards',
  templateUrl: './awards.component.html',
  styleUrls: ['./awards.component.css'],
  standalone: false,
})
export class AwardsComponent implements OnInit {
  constructor(private readonly awardsService: AwardsService) {}

  ngOnInit(): void {
    this.awardsService.initialize();
  }
}
