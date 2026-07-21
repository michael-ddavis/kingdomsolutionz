import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  combineLatest,
  map
} from 'rxjs';

import {
  Assignment,
  AssignmentActivityItem,
  AssignmentFlight,
  AssignmentStage,
  AssignmentTask
} from '../../shared/models/assignment.model';
import {
  CareNetworkState,
  MinistryResponse
} from '../../shared/models/care-referral.model';
import {
  KingdomNotification
} from '../../shared/models/notification.model';
import {
  SpeakingRequest,
  SpeakingRequestCommunication
} from '../../shared/models/speaking-request.model';
import { Workspace } from '../../shared/models/workspace.model';
import { AssignmentService } from '../../shared/services/assignment.service';
import { CareReferralService } from '../../shared/services/care-referral.service';
import { NotificationCenterService } from '../../shared/services/notification-center.service';
import { SpeakingRequestService } from '../../shared/services/speaking-request.service';
import { WorkspaceService } from '../../shared/services/workspace.service';

type DashboardTone =
  | 'amber'
  | 'blue'
  | 'green'
  | 'navy'
  | 'violet';

interface DashboardMetric {
  value: string;
  label: string;
  detail: string;
  tone: DashboardTone;
  route: string;
}

interface DashboardScheduleItem {
  time: string;
  title: string;
  description: string;
  tone: DashboardTone;
  route: string;
}

interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  context: string;
  createdUtc: string;
  tone: DashboardTone;
  route: string;
}

interface DashboardFlight {
  id: string;
  assignmentId: number;
  direction: string;
  airline: string;
  flightNumber: string;
  airports: string;
  departureDate: string;
  departureTime: string;
  eventName: string;
  route: string;
}

interface DashboardQuickAction {
  label: string;
  description: string;
  icon: 'assignment' | 'care' | 'profile' | 'review';
  route: string;
  emphasis?: boolean;
}

interface DashboardViewModel {
  workspace: Workspace;
  eyebrow: string;
  title: string;
  description: string;
  todayLabel: string;
  metrics: DashboardMetric[];
  schedule: DashboardScheduleItem[];
  activities: DashboardActivity[];
  flights: DashboardFlight[];
  quickActions: DashboardQuickAction[];
  nextEvent: Assignment | null;
}

interface AssignmentTaskContext {
  assignment: Assignment;
  stage: AssignmentStage;
  task: AssignmentTask;
}

@Component({
  standalone: false,
  selector: 'app-platform-dashboard',
  templateUrl: './platform-dashboard.component.html',
  styleUrls: ['./platform-dashboard.component.scss']
})
export class PlatformDashboardComponent {
  readonly viewModel$: Observable<DashboardViewModel> =
    combineLatest([
      this.workspaceService.selectedWorkspace$,
      this.speakingRequestService.speakingRequests$,
      this.assignmentService.assignments$,
      this.careReferralService.state$,
      this.notificationCenterService.notifications$
    ]).pipe(
      map(([
        workspace,
        requests,
        assignments,
        careNetwork,
        notifications
      ]) => this.buildDashboard(
        workspace,
        requests,
        assignments,
        careNetwork,
        notifications
      ))
    );

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly speakingRequestService: SpeakingRequestService,
    private readonly assignmentService: AssignmentService,
    private readonly careReferralService: CareReferralService,
    private readonly notificationCenterService: NotificationCenterService,
    private readonly router: Router
  ) {}

  openRoute(route: string): void {
    if (route === '#notifications') {
      this.notificationCenterService.requestOpen();
      return;
    }

    this.router.navigateByUrl(route);
  }

  trackById(
    _index: number,
    item: { id: string }
  ): string {
    return item.id;
  }

  private buildDashboard(
    workspace: Workspace,
    requests: readonly SpeakingRequest[],
    assignments: readonly Assignment[],
    careNetwork: CareNetworkState,
    notifications: readonly KingdomNotification[]
  ): DashboardViewModel {
    const activeAssignments = assignments.filter(
      assignment => assignment.status === 'active'
    );

    const upcomingAssignments = activeAssignments
      .filter(assignment =>
        this.getDaysUntilDate(assignment.startDate) >= 0
      )
      .sort((left, right) =>
        this.parseDateOnly(left.startDate).getTime() -
        this.parseDateOnly(right.startDate).getTime()
      );

    const assignmentsThisMonth = activeAssignments.filter(
      assignment =>
        this.isInCurrentMonth(assignment.startDate)
    );

    const pendingInvitationReviews = requests.filter(
      request => request.status === 'awaiting-review'
    );

    const pendingCoordinationReviews = activeAssignments.filter(
      assignment =>
        assignment.hostCoordination.status === 'submitted'
    );

    const outstandingTasks = activeAssignments.flatMap(
      assignment => assignment.stages.flatMap(
        stage => stage.tasks.filter(
          task => task.status !== 'complete'
        )
      )
    );

    const careCasesWaiting = careNetwork.responses.filter(
      response => this.isCareCaseWaiting(response)
    );

    const peopleWaitingOnMe =
      pendingInvitationReviews.length +
      pendingCoordinationReviews.length +
      careCasesWaiting.length;

    const unreadMessages = notifications.filter(
      notification =>
        !notification.read &&
        [
          'host',
          'message'
        ].includes(notification.category)
    ).length;

    const flights = this.buildFlights(activeAssignments);
    const upcomingTripCount = new Set(
      flights.map(flight => flight.assignmentId)
    ).size;

    const averageReadiness = this.getAverageReadiness(
      activeAssignments
    );

    return {
      workspace,
      eyebrow:
        workspace.id === 'all'
          ? 'Executive ministry workspace'
          : 'Executive assignment workspace',
      title: this.getGreeting(),
      description:
        workspace.id === 'all'
          ? 'A clear view of what is scheduled, what is ready and what needs a decision across your ministries.'
          : 'Everything requiring your attention across speaking invitations, assignments, travel and ministry follow-up.',
      todayLabel: new Intl.DateTimeFormat(
        'en-US',
        {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }
      ).format(new Date()),
      metrics: [
        {
          value: assignmentsThisMonth.length.toString(),
          label: 'Assignments this month',
          detail: 'Scheduled ministry assignments',
          tone: 'navy',
          route: '/app/assignments'
        },
        {
          value: upcomingTripCount.toString(),
          label: 'Upcoming trips',
          detail:
            flights.length > 0
              ? `${flights.length} confirmed flight segments`
              : 'No flights confirmed yet',
          tone: 'blue',
          route: '/app/assignments'
        },
        {
          value: (
            pendingInvitationReviews.length +
            pendingCoordinationReviews.length
          ).toString(),
          label: 'Pending reviews',
          detail:
            pendingCoordinationReviews.length > 0
              ? `${pendingCoordinationReviews.length} host submissions included`
              : 'Invitations and host updates',
          tone: 'violet',
          route:
            pendingCoordinationReviews[0]
              ? `/app/assignments/${pendingCoordinationReviews[0].id}/coordination-review`
              : '/app/speaking-requests'
        },
        {
          value: unreadMessages.toString(),
          label: 'Unread messages',
          detail: 'Host replies and coordination updates',
          tone: 'amber',
          route: '#notifications'
        },
        {
          value: outstandingTasks.length.toString(),
          label: 'Outstanding checklist items',
          detail: 'Across active assignments',
          tone:
            outstandingTasks.some(
              task => task.status === 'blocked'
            )
              ? 'amber'
              : 'blue',
          route: '/app/assignments'
        },
        {
          value: peopleWaitingOnMe.toString(),
          label: 'People waiting on me',
          detail: 'A response or decision is needed',
          tone:
            peopleWaitingOnMe > 0
              ? 'amber'
              : 'green',
          route:
            careCasesWaiting.length > 0
              ? '/app/care-network'
              : '/app/speaking-requests'
        },
        {
          value: `${averageReadiness}%`,
          label: 'Readiness score',
          detail: 'Average across active assignments',
          tone:
            averageReadiness >= 75
              ? 'green'
              : averageReadiness >= 45
                ? 'blue'
                : 'amber',
          route: '/app/assignments'
        },
        {
          value: upcomingAssignments.length.toString(),
          label: 'Upcoming events',
          detail:
            upcomingAssignments[0]
              ? `Next: ${this.formatShortDate(upcomingAssignments[0].startDate)}`
              : 'No upcoming events',
          tone: 'navy',
          route: '/app/assignments'
        }
      ],
      schedule: this.buildSchedule(
        pendingCoordinationReviews,
        pendingInvitationReviews,
        careCasesWaiting,
        activeAssignments,
        upcomingAssignments
      ),
      activities: this.buildActivities(
        assignments,
        requests
      ),
      flights,
      quickActions: this.buildQuickActions(
        pendingCoordinationReviews
      ),
      nextEvent: upcomingAssignments[0] ?? null
    };
  }

  private buildSchedule(
    coordinationReviews: readonly Assignment[],
    invitationReviews: readonly SpeakingRequest[],
    careCases: readonly MinistryResponse[],
    activeAssignments: readonly Assignment[],
    upcomingAssignments: readonly Assignment[]
  ): DashboardScheduleItem[] {
    const items: DashboardScheduleItem[] = [];

    if (coordinationReviews[0]) {
      items.push({
        time: '9:00 AM',
        title: 'Review host coordination update',
        description: coordinationReviews[0].eventName,
        tone: 'violet',
        route:
          `/app/assignments/${coordinationReviews[0].id}/coordination-review`
      });
    }

    if (invitationReviews[0]) {
      items.push({
        time: items.length > 0 ? '10:30 AM' : '9:30 AM',
        title: 'Review speaking invitation',
        description:
          `${invitationReviews[0].eventName} · ${invitationReviews[0].organizationName}`,
        tone: 'blue',
        route:
          `/app/speaking-requests/${invitationReviews[0].id}`
      });
    }

    if (careCases[0]) {
      items.push({
        time: '11:30 AM',
        title: 'Complete care follow-up',
        description:
          `${careCases[0].personName} · ${careCases[0].requestedSupport}`,
        tone: 'amber',
        route:
          `/app/assignments/${careCases[0].assignmentId}/care-network`
      });
    }

    const dueTask = this.getMostUrgentTask(
      activeAssignments
    );

    if (dueTask && items.length < 4) {
      items.push({
        time: '1:30 PM',
        title: dueTask.task.title,
        description:
          `${dueTask.assignment.eventName} · ${dueTask.stage.name}`,
        tone:
          dueTask.task.status === 'blocked' ||
          this.getDaysUntilDate(dueTask.task.dueDate) < 0
            ? 'amber'
            : 'navy',
        route:
          `/app/assignments/${dueTask.assignment.id}/checklist`
      });
    }

    if (
      items.length === 0 &&
      upcomingAssignments[0]
    ) {
      items.push({
        time: '2:00 PM',
        title: 'Assignment readiness review',
        description:
          `${upcomingAssignments[0].eventName} · ${upcomingAssignments[0].readinessPercentage}% ready`,
        tone: 'navy',
        route:
          `/app/assignments/${upcomingAssignments[0].id}/overview`
      });
    }

    return items.slice(0, 4);
  }

  private buildActivities(
    assignments: readonly Assignment[],
    requests: readonly SpeakingRequest[]
  ): DashboardActivity[] {
    const assignmentActivities = assignments.flatMap(
      assignment => assignment.activityLog.items.map(
        activity => this.fromAssignmentActivity(
          assignment,
          activity
        )
      )
    );

    const requestActivities = requests.flatMap(
      request => request.communications.map(
        communication => this.fromRequestActivity(
          request,
          communication
        )
      )
    );

    return [
      ...assignmentActivities,
      ...requestActivities
    ]
      .sort(
        (left, right) =>
          new Date(right.createdUtc).getTime() -
          new Date(left.createdUtc).getTime()
      )
      .slice(0, 5);
  }

  private fromAssignmentActivity(
    assignment: Assignment,
    activity: AssignmentActivityItem
  ): DashboardActivity {
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

    return {
      id:
        `assignment-${assignment.id}-activity-${activity.id}`,
      title: activity.title,
      description: activity.description,
      context: assignment.eventName,
      createdUtc: activity.createdUtc,
      tone:
        activity.tone === 'success'
          ? 'green'
          : activity.tone === 'attention'
            ? 'amber'
            : 'blue',
      route:
        activity.type === 'host-coordination-submitted'
          ? `/app/assignments/${assignment.id}/coordination-review`
          : `/app/assignments/${assignment.id}/${sectionRoutes[activity.section]}`
    };
  }

  private fromRequestActivity(
    request: SpeakingRequest,
    communication: SpeakingRequestCommunication
  ): DashboardActivity {
    const titles: Record<
      SpeakingRequestCommunication['type'],
      string
    > = {
      submitted: 'Speaking invitation received',
      'information-requested': 'Host information requested',
      'host-responded': 'Host response received',
      approved: 'Speaking invitation approved',
      declined: 'Speaking invitation declined'
    };

    return {
      id:
        `request-${request.id}-activity-${communication.id}`,
      title: titles[communication.type],
      description: communication.message,
      context: request.eventName,
      createdUtc: communication.createdUtc,
      tone:
        communication.type === 'approved'
          ? 'green'
          : communication.type === 'host-responded' ||
              communication.type === 'submitted'
            ? 'violet'
            : 'blue',
      route: `/app/speaking-requests/${request.id}`
    };
  }

  private buildFlights(
    assignments: readonly Assignment[]
  ): DashboardFlight[] {
    return assignments.flatMap(assignment => [
      this.fromFlight(
        assignment,
        assignment.travelItinerary.outboundFlight,
        'Outbound'
      ),
      this.fromFlight(
        assignment,
        assignment.travelItinerary.returnFlight,
        'Return'
      )
    ])
      .filter(
        (flight): flight is DashboardFlight =>
          flight !== null &&
          this.getDaysUntilDate(flight.departureDate) >= 0
      )
      .sort(
        (left, right) =>
          this.parseDateOnly(left.departureDate).getTime() -
          this.parseDateOnly(right.departureDate).getTime()
      )
      .slice(0, 4);
  }

  private fromFlight(
    assignment: Assignment,
    flight: AssignmentFlight,
    direction: string
  ): DashboardFlight | null {
    if (
      !flight.departureDate ||
      !flight.departureAirport.trim() ||
      !flight.arrivalAirport.trim()
    ) {
      return null;
    }

    return {
      id:
        `${assignment.id}-${flight.type}-${flight.departureDate}`,
      assignmentId: assignment.id,
      direction,
      airline: flight.airline || 'Airline pending',
      flightNumber: flight.flightNumber,
      airports:
        `${flight.departureAirport} → ${flight.arrivalAirport}`,
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      eventName: assignment.eventName,
      route: `/app/assignments/${assignment.id}/travel`
    };
  }

  private buildQuickActions(
    coordinationReviews: readonly Assignment[]
  ): DashboardQuickAction[] {
    const actions: DashboardQuickAction[] = [];

    if (coordinationReviews[0]) {
      actions.push({
        label: 'Review host update',
        description:
          coordinationReviews[0].eventName,
        icon: 'review',
        route:
          `/app/assignments/${coordinationReviews[0].id}/coordination-review`,
        emphasis: true
      });
    }

    actions.push(
      {
        label: 'Review invitations',
        description: 'Approve or request information',
        icon: 'review',
        route: '/app/speaking-requests'
      },
      {
        label: 'Open assignments',
        description: 'Travel, contacts and preparation',
        icon: 'assignment',
        route: '/app/assignments'
      },
      {
        label: 'Open Care Network',
        description: 'Responses, referrals and follow-up',
        icon: 'care',
        route: '/app/care-network'
      },
      {
        label: 'Speaker profile',
        description: 'Approved bio, assets and preferences',
        icon: 'profile',
        route: '/app/speaker-profile'
      }
    );

    return actions.slice(0, 4);
  }

  private getMostUrgentTask(
    assignments: readonly Assignment[]
  ): AssignmentTaskContext | null {
    const contexts = assignments.flatMap(
      assignment => assignment.stages.flatMap(
        stage => stage.tasks
          .filter(task => task.status !== 'complete')
          .map(task => ({
            assignment,
            stage,
            task
          }))
      )
    );

    return contexts.sort((left, right) => {
      if (
        left.task.status === 'blocked' &&
        right.task.status !== 'blocked'
      ) {
        return -1;
      }

      if (
        right.task.status === 'blocked' &&
        left.task.status !== 'blocked'
      ) {
        return 1;
      }

      return (
        this.parseDateOnly(left.task.dueDate).getTime() -
        this.parseDateOnly(right.task.dueDate).getTime()
      );
    })[0] ?? null;
  }

  private isCareCaseWaiting(
    response: MinistryResponse
  ): boolean {
    if (
      [
        'connected',
        'unreachable',
        'withdrawn'
      ].includes(response.status)
    ) {
      return false;
    }

    return (
      [
        'needs-review',
        'ready-to-refer'
      ].includes(response.status) ||
      Boolean(
        response.nextFollowUpUtc &&
        new Date(response.nextFollowUpUtc).getTime() <=
          Date.now()
      )
    );
  }

  private getAverageReadiness(
    assignments: readonly Assignment[]
  ): number {
    if (assignments.length === 0) {
      return 0;
    }

    return Math.round(
      assignments.reduce(
        (sum, assignment) =>
          sum + assignment.readinessPercentage,
        0
      ) / assignments.length
    );
  }

  private isInCurrentMonth(value: string): boolean {
    const date = this.parseDateOnly(value);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  }

  private getDaysUntilDate(value: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = this.parseDateOnly(value);
    date.setHours(0, 0, 0, 0);

    return Math.round(
      (date.getTime() - today.getTime()) /
      86_400_000
    );
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T12:00:00`);
  }

  private formatShortDate(value: string): string {
    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    ).format(this.parseDateOnly(value));
  }

  private getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning, Apostle Cynthia';
    }

    if (hour < 18) {
      return 'Good afternoon, Apostle Cynthia';
    }

    return 'Good evening, Apostle Cynthia';
  }
}
