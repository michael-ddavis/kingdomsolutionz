import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  SpeakingRequest,
  SpeakingRequestStatus
} from '../../../shared/models/speaking-request.model';

import {
  SpeakingRequestService
} from '../../../shared/services/speaking-request.service';
import { Router } from '@angular/router';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

interface ReadinessItem {
  label: string;
  description: string;
  complete: boolean;
}

type StatusTone =
  | 'violet'
  | 'amber'
  | 'green'
  | 'gray';

@Component({
  selector: 'app-speaking-request-detail',
  templateUrl: './speaking-request-detail.component.html',
  styleUrls: ['./speaking-request-detail.component.scss']
})
export class SpeakingRequestDetailComponent {
  private readonly requestId =
    Number(this.route.snapshot.paramMap.get('id'));

  readonly request$: Observable<SpeakingRequest | undefined> =
    this.speakingRequestService.getSpeakingRequest(
      this.requestId
    );

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
    private readonly route: ActivatedRoute,
    private readonly router: Router,

    private readonly speakingRequestService:
      SpeakingRequestService,

    private readonly speakerAssignmentService:
      AssignmentService
  ) { }

  updateStatus(
    status: SpeakingRequestStatus,
    request: SpeakingRequest
  ): void {
    this.speakingRequestService.updateStatus(
      this.requestId,
      status
    );

    if (status !== 'approved') {
      return;
    }

    const journey =
      this.speakerAssignmentService.createOrGetAssignment(
        {
          ...request,
          status: 'approved'
        }
      );

    this.router.navigate([
      '/app/speaker-journeys',
      journey.id
    ]);
  }

  getReadinessItems(
    request: SpeakingRequest
  ): readonly ReadinessItem[] {
    return [
      {
        label: 'Event dates and venue',
        description:
          'The event dates and ministry location have been provided.',
        complete:
          Boolean(request.startDate) &&
          Boolean(request.endDate) &&
          Boolean(request.venueName)
      },
      {
        label: 'Primary host contact',
        description:
          'The ministry has supplied a reachable local contact.',
        complete:
          Boolean(request.contactName) &&
          Boolean(request.contactEmail) &&
          Boolean(request.contactPhone)
      },
      {
        label: 'Travel coverage',
        description:
          'Airfare or other travel expenses have been addressed.',
        complete: request.travelCovered
      },
      {
        label: 'Lodging arrangements',
        description:
          'Hotel or ministry lodging has been confirmed.',
        complete: request.lodgingCovered
      },
      {
        label: 'Honorarium arrangement',
        description:
          'The honorarium expectation has been confirmed.',
        complete: request.honorariumProvided
      },
      {
        label: 'Ministry request',
        description:
          'The host has explained the requested ministry assignment.',
        complete: Boolean(request.ministryRequest)
      },
      {
        label: 'Attendance estimate',
        description:
          'An expected attendance count has been provided.',
        complete: request.expectedAttendance > 0
      }
    ];
  }

  openAssignment(
    request: SpeakingRequest
  ): void {
    const journey =
      this.speakerAssignmentService.createOrGetAssignment(
        request
      );

    this.router.navigate([
      '/app/speaker-journeys',
      journey.id
    ]);
  }

  getCompletedReadinessCount(
    request: SpeakingRequest
  ): number {
    return this.getReadinessItems(request).filter(
      item => item.complete
    ).length;
  }
}