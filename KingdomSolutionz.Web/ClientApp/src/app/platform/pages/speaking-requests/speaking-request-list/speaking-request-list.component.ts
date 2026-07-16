import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SpeakingRequest,
  SpeakingRequestStatus
} from '../../../shared/models/speaking-request.model';

import {
  SpeakingRequestService
} from '../../../shared/services/speaking-request.service';
import {
  AssignmentService
} from '../../../shared/services/assignment.service';

type StatusTone =
  | 'blue'
  | 'violet'
  | 'green'
  | 'amber'
  | 'gray';

@Component({
  standalone: false,
  selector: 'app-speaking-request-list',
  templateUrl: './speaking-request-list.component.html',
  styleUrls: ['./speaking-request-list.component.scss']
})
export class SpeakingRequestListComponent {
  readonly speakingRequests$:
    Observable<readonly SpeakingRequest[]>;

  readonly statusLabels:
    Record<SpeakingRequestStatus, string> = {
      'awaiting-review': 'Awaiting review',
      'information-needed': 'Information needed',
      approved: 'Approved',
      declined: 'Declined'
    };

  readonly statusTones:
    Record<SpeakingRequestStatus, StatusTone> = {
      'awaiting-review': 'violet',
      'information-needed': 'amber',
      approved: 'green',
      declined: 'gray'
    };

  constructor(
    private readonly speakingRequestService:
      SpeakingRequestService,
    private readonly assignmentService:
      AssignmentService
  ) {
    this.speakingRequests$ =
      this.speakingRequestService.speakingRequests$;
  }

  resetDemo(): void {
    this.assignmentService.resetDemoAssignments();
    this.speakingRequestService.resetDemoRequests();
  }

  getReadinessTone(
    percentage: number
  ): 'green' | 'amber' | 'red' {
    if (percentage >= 80) {
      return 'green';
    }

    if (percentage >= 60) {
      return 'amber';
    }

    return 'red';
  }

  countByStatus(
    requests: readonly SpeakingRequest[],
    status: SpeakingRequestStatus
  ): number {
    return requests.filter(
      request => request.status === status
    ).length;
  }
}
