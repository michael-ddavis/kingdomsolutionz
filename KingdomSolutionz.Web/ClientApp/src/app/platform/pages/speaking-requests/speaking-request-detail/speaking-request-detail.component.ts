import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  SpeakingRequest,
  SpeakingRequestCommunication,
  SpeakingRequestConfirmation,
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

type DecisionAction =
  | 'information'
  | 'decline';

@Component({
  standalone: false,
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

  actionMode: DecisionAction | null = null;

  readonly decisionForm =
    this.formBuilder.nonNullable.group({
      message:
        this.formBuilder.nonNullable.control(
          '',
          [
            Validators.required,
            Validators.maxLength(1200)
          ]
        )
    });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,

    private readonly formBuilder:
      FormBuilder,

    private readonly speakingRequestService:
      SpeakingRequestService,

    private readonly assignmentService:
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
      this.assignmentService.createOrGetAssignment(
        {
          ...request,
          status: 'approved'
        }
      );

    this.router.navigate([
      '/app/assignments',
      journey.id
    ]);
  }

  beginAction(
    action: DecisionAction
  ): void {
    this.actionMode = action;
    this.decisionForm.reset({
      message: ''
    });
  }

  cancelAction(): void {
    this.actionMode = null;
    this.decisionForm.reset({
      message: ''
    });
  }

  submitDecisionAction(): void {
    if (
      !this.actionMode ||
      this.decisionForm.invalid
    ) {
      this.decisionForm.markAllAsTouched();
      return;
    }

    const message =
      this.decisionForm.controls
        .message.value.trim();

    if (this.actionMode === 'information') {
      this.speakingRequestService
        .requestInformation(
          this.requestId,
          message
        );
    } else {
      this.speakingRequestService.updateStatus(
        this.requestId,
        'declined',
        message
      );
    }

    this.cancelAction();
  }

  getLatestInformationRequest(
    request: SpeakingRequest
  ): SpeakingRequestCommunication | undefined {
    return [...request.communications]
      .reverse()
      .find(
        communication =>
          communication.type ===
            'information-requested'
      );
  }

  getCommunicationLabel(
    communication:
      SpeakingRequestCommunication
  ): string {
    switch (communication.type) {
      case 'information-requested':
        return 'Information requested';

      case 'host-responded':
        return 'Host responded';

      case 'approved':
        return 'Invitation approved';

      case 'declined':
        return 'Invitation declined';

      case 'submitted':
      default:
        return 'Invitation submitted';
    }
  }

  getCommunicationHistory(
    request: SpeakingRequest
  ): SpeakingRequestCommunication[] {
    return [
      ...request.communications
    ].reverse();
  }

  getConfirmationLabel(
    value: SpeakingRequestConfirmation
  ): string {
    switch (value) {
      case 'yes':
        return 'Yes';
      case 'no':
        return 'No';
      default:
        return 'Not determined';
    }
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
        complete:
          request.travelCoverageStatus !==
            'not-determined'
      },
      {
        label: 'Lodging arrangements',
        description:
          'Hotel or ministry lodging has been confirmed.',
        complete:
          request.lodgingCoverageStatus !==
            'not-determined'
      },
      {
        label: 'Honorarium arrangement',
        description:
          'The honorarium expectation has been confirmed.',
        complete:
          request.honorariumStatus !==
            'not-determined'
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
      this.assignmentService.createOrGetAssignment(
        request
      );

    this.router.navigate([
      '/app/assignments',
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
