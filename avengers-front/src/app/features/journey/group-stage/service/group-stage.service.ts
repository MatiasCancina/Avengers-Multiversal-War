import { Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { toApiError } from '../../../../core/models/api-error.interface';
import { GroupStageApi } from '../model/group-stage-api.interface';
import { GroupStageViewModel } from '../model/group-stage-view-model.interface';

@Injectable({ providedIn: 'root' })
export class GroupStageService extends BaseApiService {
  private readonly pageState: GroupStageViewModel = {
    status: 'loading',
    error: null,
    data: null,
    selectedGroupId: null,
  };

  constructor(api: ApiService) {
    super(api);
  }

  initialize(): void {
    this.loadGroupStage();
  }

  getViewModel(): GroupStageViewModel {
    return this.pageState;
  }

  selectGroup(groupId: string): void {
    if (this.pageState.data?.groups.some((group) => group.groupId === groupId)) {
      this.pageState.selectedGroupId = groupId;
    }
  }

  private loadGroupStage(): void {
    this.pageState.status = 'loading';
    this.pageState.error = null;

    this.getData<GroupStageApi>('/journey/group-stage').subscribe({
      next: (data) => {
        this.pageState.data = data;
        this.pageState.selectedGroupId =
          data.groups.find((group) => group.groupId === data.playerGroupId)?.groupId ??
          data.groups[0]?.groupId ??
          null;
        this.pageState.status = data.journeyAvailable ? 'data' : 'empty';
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this.pageState.status = 'error';
        this.pageState.error = apiError.message;
      },
    });
  }
}
