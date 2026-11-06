import { Component, OnInit } from '@angular/core';
import { GroupStageService } from './service/group-stage.service';

@Component({
  selector: 'app-group-stage',
  templateUrl: './group-stage.component.html',
  styleUrls: ['./group-stage.component.css'],
  standalone: false,
})
export class GroupStageComponent implements OnInit {
  constructor(private readonly groupStageService: GroupStageService) {}

  get pageState() {
    return this.groupStageService.getViewModel();
  }

  ngOnInit(): void {
    this.groupStageService.initialize();
  }

  onGroupChange(groupId: string): void {
    this.groupStageService.selectGroup(groupId);
  }

  getTeamName(teamId: string): string {
    const groups = this.pageState.data?.groups ?? [];

    for (const group of groups) {
      const standing = group.standings.find((standing) => standing.teamId === teamId);

      if (standing) {
        return standing.teamName;
      }
    }

    return teamId;
  }
}
