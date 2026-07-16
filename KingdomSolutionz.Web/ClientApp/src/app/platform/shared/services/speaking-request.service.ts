import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CreateSpeakingRequestInput,
  SpeakingRequest,
  SpeakingRequestStatus
} from '../models/speaking-request.model';

import {
  SEEDED_SPEAKING_REQUESTS
} from '../demo-data/speaking-request.seed';

@Injectable({
  providedIn: 'root'
})
export class SpeakingRequestService {
  private readonly requestsSubject =
    new BehaviorSubject<readonly SpeakingRequest[]>([
      ...SEEDED_SPEAKING_REQUESTS
    ]);

  readonly speakingRequests$ =
    this.requestsSubject.asObservable();

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

  updateStatus(
    requestId: number,
    status: SpeakingRequestStatus
  ): void {
    const updatedRequests =
      this.requestsSubject.value.map(request =>
        request.id === requestId
          ? {
              ...request,
              status
            }
          : request
      );

    this.requestsSubject.next(updatedRequests);
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

      input.travelCovered,
      input.lodgingCovered,
      input.honorariumProvided,

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
      submittedUtc: new Date().toISOString()
    };

    this.requestsSubject.next([
      newRequest,
      ...this.requestsSubject.value
    ]);

    return newRequest;
  }
}
