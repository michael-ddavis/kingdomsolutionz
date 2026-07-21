import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  map
} from 'rxjs';

import {
  Assignment,
  AssignmentActivityItem
} from '../models/assignment.model';
import {
  CareNetworkState,
  CareReferral,
  MinistryResponse
} from '../models/care-referral.model';
import {
  KingdomNotification,
  KingdomNotificationCategory,
  KingdomNotificationTone
} from '../models/notification.model';
import {
  SpeakingRequest,
  SpeakingRequestCommunication
} from '../models/speaking-request.model';
import { AssignmentService } from './assignment.service';
import { CareReferralService } from './care-referral.service';
import { SpeakingRequestService } from './speaking-request.service';

interface NotificationDraft {
  id: string;
  category: KingdomNotificationCategory;
  tone: KingdomNotificationTone;
  title: string;
  description: string;
  context: string;
  createdUtc: string;
  route: string;
  actionLabel: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationCenterService {
  private readonly storageKey =
    'kingdomops-notification-read-state-v1';

  private readonly readIdsSubject =
    new BehaviorSubject<readonly string[]>(
      this.loadReadIds()
    );

  private readonly openRequestsSubject =
    new Subject<void>();

  readonly openRequests$ =
    this.openRequestsSubject.asObservable();

  readonly notifications$: Observable<
    readonly KingdomNotification[]
  > = combineLatest([
    this.assignmentService.assignments$,
    this.speakingRequestService.speakingRequests$,
    this.careReferralService.state$,
    this.readIdsSubject
  ]).pipe(
    map(([
      assignments,
      requests,
      careNetwork,
      readIds
    ]) => {
      const readIdSet = new Set(readIds);

      return this.buildNotifications(
        assignments,
        requests,
        careNetwork
      )
        .sort(
          (left, right) =>
            new Date(right.createdUtc).getTime() -
            new Date(left.createdUtc).getTime()
        )
        .map(notification => ({
          ...notification,
          read: readIdSet.has(notification.id)
        }))
        .slice(0, 40);
    })
  );

  readonly unreadCount$ = this.notifications$.pipe(
    map(notifications =>
      notifications.filter(
        notification => !notification.read
      ).length
    )
  );

  constructor(
    private readonly assignmentService:
      AssignmentService,
    private readonly speakingRequestService:
      SpeakingRequestService,
    private readonly careReferralService:
      CareReferralService
  ) {}

  markAsRead(notificationId: string): void {
    if (
      this.readIdsSubject.value.includes(
        notificationId
      )
    ) {
      return;
    }

    this.publishReadIds([
      ...this.readIdsSubject.value,
      notificationId
    ]);
  }

  requestOpen(): void {
    this.openRequestsSubject.next();
  }

  markAllAsRead(
    notifications: readonly KingdomNotification[]
  ): void {
    const readIds = new Set(
      this.readIdsSubject.value
    );

    for (const notification of notifications) {
      readIds.add(notification.id);
    }

    this.publishReadIds([...readIds]);
  }

  private buildNotifications(
    assignments: readonly Assignment[],
    requests: readonly SpeakingRequest[],
    careNetwork: CareNetworkState
  ): NotificationDraft[] {
    return [
      ...assignments.flatMap(assignment => [
        ...assignment.activityLog.items.map(activity =>
          this.fromAssignmentActivity(
            assignment,
            activity
          )
        ),
        ...this.buildHostDetailNotifications(assignment),
        ...this.buildAgreementNotifications(assignment)
      ]),
      ...requests.flatMap(request =>
        request.communications.map(communication =>
          this.fromRequestCommunication(
            request,
            communication
          )
        )
      ),
      ...careNetwork.responses.map(response =>
        this.fromCareResponse(response, assignments)
      ),
      ...careNetwork.referrals
        .filter(referral =>
          [
            'accepted',
            'declined',
            'expired',
            'connected'
          ].includes(referral.status)
        )
        .map(referral =>
          this.fromCareReferral(
            referral,
            careNetwork,
            assignments
          )
        )
    ];
  }

  private fromAssignmentActivity(
    assignment: Assignment,
    activity: AssignmentActivityItem
  ): NotificationDraft {
    const defaultRoute =
      this.getAssignmentSectionRoute(
        assignment.id,
        activity
      );

    const base: NotificationDraft = {
      id:
        `assignment-${assignment.id}-activity-${activity.id}`,
      category: 'assignment',
      tone:
        activity.tone === 'attention'
          ? 'attention'
          : activity.tone === 'success'
            ? 'success'
            : 'info',
      title: activity.title,
      description: activity.description,
      context: assignment.eventName,
      createdUtc: activity.createdUtc,
      route: defaultRoute,
      actionLabel: 'Open assignment'
    };

    switch (activity.type) {
      case 'host-coordination-submitted':
        return {
          ...base,
          category: 'review',
          tone: 'attention',
          title: 'Host update ready for review',
          route:
            `/app/assignments/${assignment.id}/coordination-review`,
          actionLabel: 'Review update'
        };

      case 'host-coordination-changes-requested':
        return {
          ...base,
          category: 'message',
          title: 'Corrections sent to host',
          route:
            `/app/assignments/${assignment.id}/coordination-review`,
          actionLabel: 'View request'
        };

      case 'host-coordination-reviewed':
        return {
          ...base,
          category: 'travel',
          title: 'Travel itinerary approved',
          description:
            'The submitted travel, lodging and coordination details are approved for the assignment team.',
          route:
            `/app/assignments/${assignment.id}/travel`,
          actionLabel: 'View itinerary'
        };

      case 'travel-updated':
        return {
          ...base,
          category: 'travel',
          title: 'Travel itinerary updated',
          actionLabel: 'View travel'
        };

      case 'document-uploaded':
        return {
          ...base,
          category: 'documents',
          title:
            activity.description.toLowerCase()
              .includes('media')
              ? 'Media documents uploaded'
              : 'Assignment document uploaded',
          actionLabel: 'View document'
        };

      case 'referral-accepted':
      case 'person-connected':
        return {
          ...base,
          category: 'care',
          actionLabel: 'Open care case'
        };

      case 'note-added':
        if (
          activity.actor.toLowerCase().includes('host')
        ) {
          return {
            ...base,
            category: 'host',
            title: 'Host sent an update',
            route:
              `/app/assignments/${assignment.id}/coordination-review`,
            actionLabel: 'View update'
          };
        }

        return base;

      default:
        return base;
    }
  }

  private fromRequestCommunication(
    request: SpeakingRequest,
    communication: SpeakingRequestCommunication
  ): NotificationDraft {
    const route =
      `/app/speaking-requests/${request.id}`;

    const base: NotificationDraft = {
      id:
        `request-${request.id}-communication-${communication.id}`,
      category: 'review',
      tone: 'info',
      title: 'Speaking invitation updated',
      description: communication.message,
      context: request.eventName,
      createdUtc: communication.createdUtc,
      route,
      actionLabel: 'Open invitation'
    };

    switch (communication.type) {
      case 'submitted':
        return {
          ...base,
          tone: 'attention',
          title: 'New speaking invitation',
          description:
            `${request.organizationName} submitted an invitation for review.`
        };

      case 'host-responded':
        return {
          ...base,
          category: 'message',
          tone: 'attention',
          title: 'Host replied to your request',
          actionLabel: 'Review reply'
        };

      case 'information-requested':
        return {
          ...base,
          category: 'message',
          title: 'Information requested from host'
        };

      case 'approved':
        return {
          ...base,
          tone: 'success',
          title: 'Speaking invitation approved'
        };

      case 'declined':
        return {
          ...base,
          title: 'Speaking invitation declined'
        };

      default:
        return base;
    }
  }

  private fromCareResponse(
    response: MinistryResponse,
    assignments: readonly Assignment[]
  ): NotificationDraft {
    const assignment = assignments.find(
      item => item.id === response.assignmentId
    );

    const isPrayerRequest =
      response.responseType
        .toLowerCase()
        .includes('prayer') ||
      response.requestedSupport
        .toLowerCase()
        .includes('prayer');

    return {
      id:
        `care-response-${response.id}-${response.status}`,
      category: 'care',
      tone:
        response.status === 'ready-to-refer' ||
        response.status === 'needs-review'
          ? 'attention'
          : response.status === 'connected'
            ? 'success'
            : 'info',
      title:
        isPrayerRequest
          ? 'Prayer request added'
          : 'New ministry response added',
      description:
        `${response.personName} requested ${response.requestedSupport.toLowerCase()}.`,
      context:
        assignment?.eventName ?? 'KingdomOps Care Network',
      createdUtc: response.receivedUtc,
      route:
        `/app/assignments/${response.assignmentId}/care-network`,
      actionLabel: 'Open care case'
    };
  }

  private fromCareReferral(
    referral: CareReferral,
    careNetwork: CareNetworkState,
    assignments: readonly Assignment[]
  ): NotificationDraft {
    const response = careNetwork.responses.find(
      item => item.id === referral.responseId
    );

    const partner = careNetwork.partners.find(
      item => item.id === referral.partnerId
    );

    const assignment = assignments.find(
      item => item.id === referral.assignmentId
    );

    const titleByStatus: Record<
      'accepted' | 'declined' | 'expired' | 'connected',
      string
    > = {
      accepted: 'Care referral accepted',
      declined: 'Care referral declined',
      expired: 'Care referral needs reassignment',
      connected: 'Local connection confirmed'
    };

    const status = referral.status as
      'accepted' | 'declined' | 'expired' | 'connected';

    return {
      id: `care-referral-${referral.id}-${status}`,
      category: 'care',
      tone:
        status === 'connected'
          ? 'success'
          : status === 'declined' ||
              status === 'expired'
            ? 'attention'
            : 'info',
      title: titleByStatus[status],
      description:
        `${partner?.name ?? 'A local partner'} updated the referral for ${response?.personName ?? 'this care case'}.`,
      context:
        assignment?.eventName ?? 'KingdomOps Care Network',
      createdUtc:
        referral.connectedUtc ??
        referral.respondedUtc ??
        referral.sentUtc ??
        response?.receivedUtc ??
        '1970-01-01T00:00:00Z',
      route:
        `/app/assignments/${referral.assignmentId}/care-network`,
      actionLabel: 'Open care case'
    };
  }

  private buildAgreementNotifications(
    assignment: Assignment
  ): NotificationDraft[] {
    if (assignment.invitation.agreementStatus !== 'signed') {
      return [];
    }

    return [
      {
        id: `assignment-${assignment.id}-agreement-signed`,
        category: 'documents',
        tone: 'success',
        title: 'Contract signed',
        description:
          'The engagement agreement is marked as signed and ready for the assignment record.',
        context: assignment.eventName,
        createdUtc:
          assignment.documentLibrary.lastUpdatedUtc ??
          assignment.createdUtc,
        route:
          `/app/assignments/${assignment.id}/documents`,
        actionLabel: 'View documents'
      }
    ];
  }

  private buildHostDetailNotifications(
    assignment: Assignment
  ): NotificationDraft[] {
    const coordination = assignment.hostCoordination;
    const createdUtc =
      coordination.lastSavedUtc ??
      coordination.submittedUtc;

    if (!createdUtc) {
      return [];
    }

    const notifications: NotificationDraft[] = [];
    const cycleId = createdUtc.replace(
      /[^0-9]/g,
      ''
    );

    if (
      coordination.changedFields.includes(
        'Hotel accommodations'
      )
    ) {
      notifications.push({
        id:
          `assignment-${assignment.id}-hotel-${cycleId}`,
        category: 'travel',
        tone: 'info',
        title: 'Host updated hotel details',
        description:
          'Lodging information changed and is ready for the assignment team to verify.',
        context: assignment.eventName,
        createdUtc,
        route:
          `/app/assignments/${assignment.id}/coordination-review`,
        actionLabel: 'Review lodging'
      });
    }

    if (coordination.prayerFocus.trim()) {
      notifications.push({
        id:
          `assignment-${assignment.id}-prayer-focus-${cycleId}`,
        category: 'host',
        tone: 'info',
        title: 'Prayer focus added',
        description:
          coordination.prayerFocus.trim(),
        context: assignment.eventName,
        createdUtc,
        route:
          `/app/assignments/${assignment.id}/coordination-review`,
        actionLabel: 'View prayer focus'
      });
    }

    if (coordination.hostNotes.trim()) {
      notifications.push({
        id:
          `assignment-${assignment.id}-host-message-${cycleId}`,
        category: 'message',
        tone: 'info',
        title: 'Host sent a message',
        description: coordination.hostNotes.trim(),
        context: assignment.eventName,
        createdUtc,
        route:
          `/app/assignments/${assignment.id}/coordination-review`,
        actionLabel: 'Read message'
      });
    }

    return notifications;
  }

  private getAssignmentSectionRoute(
    assignmentId: number,
    activity: AssignmentActivityItem
  ): string {
    const sectionRoutes: Record<
      AssignmentActivityItem['section'],
      string
    > = {
      overview: 'overview',
      checklist: 'checklist',
      travel: 'travel',
      contacts: 'contacts',
      documents: 'documents',
      responses: 'care-network',
      'follow-up': 'care-network'
    };

    return `/app/assignments/${assignmentId}/${sectionRoutes[activity.section]}`;
  }

  private publishReadIds(
    readIds: readonly string[]
  ): void {
    this.readIdsSubject.next(readIds);

    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify(readIds)
      );
    } catch {
      // Read state remains available in memory.
    }
  }

  private loadReadIds(): readonly string[] {
    try {
      const stored = window.localStorage.getItem(
        this.storageKey
      );

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is string =>
              typeof item === 'string'
          );
        }
      }
    } catch {
      // Start with a clean unread state.
    }

    return [];
  }
}
