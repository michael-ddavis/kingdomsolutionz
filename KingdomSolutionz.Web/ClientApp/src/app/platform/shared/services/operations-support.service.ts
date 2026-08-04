import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  CreateOperationsSupportRequestInput,
  OperationsSupportRequest,
  OperationsSupportStatus
} from '../models/operations-support.model';

@Injectable({ providedIn: 'root' })
export class OperationsSupportService {
  private readonly storageKey =
    'kingdomos-operations-support-v1';

  private readonly requestsSubject =
    new BehaviorSubject<readonly OperationsSupportRequest[]>(
      this.loadRequests()
    );

  readonly requests$ =
    this.requestsSubject.asObservable();

  constructor() {
    this.requestsSubject.subscribe(requests => {
      try {
        window.localStorage.setItem(
          this.storageKey,
          JSON.stringify(requests)
        );
      } catch {
        // The preview remains usable in memory.
      }
    });
  }

  create(
    input: CreateOperationsSupportRequestInput,
    requestedBy = 'Michael Davis'
  ): OperationsSupportRequest {
    const now = new Date().toISOString();
    const request: OperationsSupportRequest = {
      id: this.nextId(),
      workspaceId: input.workspaceId,
      title: input.title.trim(),
      detail: input.detail.trim(),
      category: input.category,
      priority: input.priority,
      status: 'new',
      requestedBy,
      owner: 'Operations team',
      createdUtc: now,
      updatedUtc: now
    };

    this.requestsSubject.next([
      request,
      ...this.requestsSubject.value
    ]);
    return request;
  }

  updateStatus(
    requestId: number,
    status: OperationsSupportStatus
  ): void {
    const updatedUtc = new Date().toISOString();
    this.requestsSubject.next(
      this.requestsSubject.value.map(request =>
        request.id === requestId
          ? { ...request, status, updatedUtc }
          : request
      )
    );
  }

  private nextId(): number {
    return Math.max(
      1000,
      ...this.requestsSubject.value.map(request => request.id)
    ) + 1;
  }

  private loadRequests(): readonly OperationsSupportRequest[] {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as OperationsSupportRequest[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fall through to governed preview data.
    }

    const now = new Date().toISOString();
    return [
      {
        id: 1001,
        workspaceId: 'apostle-cynthia',
        title: 'Confirm assignment document owner',
        detail:
          'The host packet is uploaded, but the final approval owner is not assigned.',
        category: 'workflow',
        priority: 'high',
        status: 'in-progress',
        requestedBy: 'Cynthia Thompson Global',
        owner: 'Operations team',
        createdUtc: now,
        updatedUtc: now
      },
      {
        id: 1002,
        workspaceId: 'jpp',
        title: 'Create a reusable new-member checklist',
        detail:
          'The discipleship team needs one repeatable checklist with clear owners.',
        category: 'training',
        priority: 'normal',
        status: 'new',
        requestedBy: 'JPP ministry owner',
        owner: 'Operations team',
        createdUtc: now,
        updatedUtc: now
      }
    ];
  }
}
