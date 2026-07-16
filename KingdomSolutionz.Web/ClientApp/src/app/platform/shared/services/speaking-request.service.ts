import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CreateSpeakingRequestInput,
  SpeakingRequest,
  SpeakingRequestCommunication,
  SpeakingRequestStatus
} from '../models/speaking-request.model';

import {
  SEEDED_SPEAKING_REQUESTS
} from '../demo-data/speaking-request.seed';

@Injectable({
  providedIn: 'root'
})
export class SpeakingRequestService {
  private readonly storageKey =
    'kingdomos-demo-speaking-requests-v2';

  private readonly requestsSubject =
    new BehaviorSubject<readonly SpeakingRequest[]>(
      this.loadRequests()
    );

  readonly speakingRequests$ =
    this.requestsSubject.asObservable();

  constructor() {
    this.requestsSubject.subscribe(requests => {
      try {
        window.localStorage.setItem(
          this.storageKey,
          JSON.stringify(requests)
        );
      } catch {
        // Demo state remains available in memory.
      }
    });
  }

  getSpeakingRequest(
    requestId: number
  ): Observable<SpeakingRequest | undefined> {
    return this.speakingRequests$.pipe(
      map(requests =>
        requests.find(
          request => request.id === requestId
        )
      )
    );
  }

  resetDemoRequests(): void {
    this.requestsSubject.next([
      ...SEEDED_SPEAKING_REQUESTS
    ]);
  }

  updateStatus(
    requestId: number,
    status: SpeakingRequestStatus,
    message = ''
  ): void {
    const updatedRequests =
      this.requestsSubject.value.map(request => {
        if (request.id !== requestId) {
          return request;
        }

        const communication =
          this.createStatusCommunication(
            status,
            message
          );

        return {
          ...request,
          status,
          communications:
            communication
              ? [
                  ...request.communications,
                  communication
                ]
              : request.communications
        };
      });

    this.requestsSubject.next(updatedRequests);
  }

  requestInformation(
    requestId: number,
    message: string
  ): void {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    this.updateStatus(
      requestId,
      'information-needed',
      trimmedMessage
    );
  }

  submitHostResponse(
    requestId: number,
    message: string,
    updates: Partial<SpeakingRequest> = {}
  ): void {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const response:
      SpeakingRequestCommunication = {
      id: this.getNextCommunicationId(),
      type: 'host-responded',
      message: trimmedMessage,
      actor: 'Host coordinator',
      createdUtc: new Date().toISOString()
    };

    this.requestsSubject.next(
      this.requestsSubject.value.map(request =>
        request.id === requestId
          ? {
              ...request,
              ...updates,
              travelCovered:
                updates.travelCoverageStatus
                  ? updates.travelCoverageStatus === 'yes'
                  : request.travelCovered,
              lodgingCovered:
                updates.lodgingCoverageStatus
                  ? updates.lodgingCoverageStatus === 'yes'
                  : request.lodgingCovered,
              honorariumProvided:
                updates.honorariumStatus
                  ? updates.honorariumStatus === 'yes'
                  : request.honorariumProvided,
              status: 'awaiting-review',
              communications: [
                ...request.communications,
                response
              ]
            }
          : request
      )
    );
  }

  addSpeakingRequest(
    input: CreateSpeakingRequestInput
  ): SpeakingRequest {
    const readinessChecks = [
      Boolean(
        input.startDate &&
        input.endDate &&
        input.venueName
      ),

      Boolean(
        input.contactName &&
        input.contactEmail &&
        input.contactPhone
      ),

      input.travelCoverageStatus !==
        'not-determined',
      input.lodgingCoverageStatus !==
        'not-determined',
      input.honorariumStatus !==
        'not-determined',

      Boolean(input.ministryRequest),

      input.expectedAttendance > 0
    ];

    const completedChecks =
      readinessChecks.filter(
        item => item
      ).length;

    const readinessPercentage = Math.round(
      (
        completedChecks /
        readinessChecks.length
      ) * 100
    );

    const existingIds =
      this.requestsSubject.value.map(
        request => request.id
      );

    const nextId =
      Math.max(
        1000,
        ...existingIds
      ) + 1;

    const newRequest: SpeakingRequest = {
      ...input,

      id: nextId,
      readinessPercentage,
      status: 'awaiting-review',
      submittedUtc: new Date().toISOString(),
      communications: []
    };

    newRequest.communications = [
      {
        id: this.getNextCommunicationId(),
        type: 'submitted',
        message:
          'Speaking invitation submitted for ministry-team review.',
        actor: newRequest.contactName,
        createdUtc: newRequest.submittedUtc
      }
    ];

    this.requestsSubject.next([
      newRequest,
      ...this.requestsSubject.value
    ]);

    return newRequest;
  }

  private createStatusCommunication(
    status: SpeakingRequestStatus,
    message: string
  ): SpeakingRequestCommunication | null {
    const createdUtc = new Date().toISOString();

    switch (status) {
      case 'information-needed':
        return {
          id: this.getNextCommunicationId(),
          type: 'information-requested',
          message:
            message.trim() ||
            'Please provide the additional information requested by the ministry team.',
          actor: 'Michael Davis',
          createdUtc
        };

      case 'approved':
        return {
          id: this.getNextCommunicationId(),
          type: 'approved',
          message:
            message.trim() ||
            'The invitation was approved and moved into assignment preparation.',
          actor: 'Apostle Cynthia Ministries',
          createdUtc
        };

      case 'declined':
        return {
          id: this.getNextCommunicationId(),
          type: 'declined',
          message:
            message.trim() ||
            'The ministry team is unable to accept this invitation.',
          actor: 'Apostle Cynthia Ministries',
          createdUtc
        };

      case 'awaiting-review':
      default:
        return null;
    }
  }

  private getNextCommunicationId(): number {
    const ids =
      this.requestsSubject.value.flatMap(
        request =>
          request.communications.map(
            communication => communication.id
          )
      );

    return ids.length === 0
      ? 1
      : Math.max(...ids) + 1;
  }

  private loadRequests(): readonly SpeakingRequest[] {
    try {
      const stored = window.localStorage.getItem(
        this.storageKey
      );

      if (stored) {
        return JSON.parse(stored) as SpeakingRequest[];
      }
    } catch {
      // Fall back to deterministic demo data.
    }

    return [...SEEDED_SPEAKING_REQUESTS];
  }
}
