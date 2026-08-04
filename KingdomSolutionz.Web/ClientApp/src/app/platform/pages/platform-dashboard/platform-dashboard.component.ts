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
import { ModuleEntitlementService } from '../../shared/services/module-entitlement.service';
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
      this.notificationCenterService.notifications$,
      this.moduleEntitlements.isEnabled('care')
    ]).pipe(
      map(([
        workspace,
        requests,
        assignments,
        careNetwork,
        notifications,
        careEnabled
      ]) => this.buildDashboard(
        workspace,
        requests,
        assignments,
        careNetwork,
        notifications,
        careEnabled
      ))
    );

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly speakingRequestService: SpeakingRequestService,
    private readonly assignmentService: AssignmentService,
    private readonly careReferralService: CareReferralService,
    private readonly notificationCenterService: NotificationCenterService,
    private readonly moduleEntitlements: ModuleEntitlementService,
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
    notifications: readonly KingdomNotification[],
    careEnabled: boolean
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
      assignment => this.isInCurrentMonth(assignment.startDate)
    );
    const pendingInvitationReviews = requests.filter(
      request => request.status === 'awaiting-review'
    );
    const outstandingTasks = activeAssignments.flatMap(
      assignment => (assignment.stages ?? []).flatMap(
        stage => stage.tasks.filter(
          task => task.status !== 'complete'
        )
      )
    );
    const careCasesWaiting = careEnabled
      ? (careNetwork.responses ?? []).filter(
          response => this.isCareCaseWaiting(response)
        )
      : [];
    const peopleWaitingOnMe =
      pendingInvitationReviews.length +
      careCasesWaiting.length;
    const unreadMessages = notifications.filter(
      notification =>
        !notification.read &&
        ['host', 'message'].includes(notification.category)
    ).length;
    const averageReadiness = this.getAverageReadiness(
      activeAssignments
    );

    const metrics: DashboardMetric[] = [
      {
        value: assignmentsThisMonth.length.toString(),
        label: 'Assignments this month',
        detail: 'Scheduled ministry assignments',
        tone: 'navy',
        route: '/app/assignments'
      },
      {
        value: pendingInvitationReviews.length.toString(),
        label: 'Invitations to review',
        detail: 'Host invitations awaiting a decision',
        tone: 'violet',
        route: '/app/speaking-requests'
      },
      {
        value: unreadMessages.toString(),
        label: 'Unread messages',
        detail: 'Host replies and assignment updates',
        tone: 'amber',
        route: '#notifications'
      },
      {
        value: outstandingTasks.length.toString(),
        label: 'Outstanding checklist items',
        detail: 'Across active assignments',
        tone: outstandingTasks.some(
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
        tone: peopleWaitingOnMe > 0
          ? 'amber'
          : 'green',
        route: careCasesWaiting.length > 0
          ? '/app/care-network'
          : '/app/speaking-requests'
      },
      {
        value: `${averageReadiness}%`,
        label: 'Preparation score',
        detail: 'Average across active assignments',
        tone: averageReadiness >= 75
          ? 'green'
          : averageReadiness >= 45
            ? 'blue'
            : 'amber',
        route: '/app/assignments'
      },
      {
        value: upcomingAssignments.length.toString(),
        label: 'Upcoming events',
        detail: upcomingAssignments[0]
          ? `Next: ${this.formatShortDate(upcomingAssignments[0].startDate)}`
          : 'No upcoming events',
        tone: 'navy',
        route: '/app/assignments'
      }
    ];

    if (careEnabled) {
      metrics.splice(5, 0, {
        value: careCasesWaiting.length.toString(),
        label: 'Care follow-ups',
        detail: 'Responses needing a next step',
        tone: careCasesWaiting.length > 0
          ? 'amber'
          : 'green',
        route: '/app/care-network'
      });
    }

    return {
      workspace,
      eyebrow: workspace.id === 'all'
        ? 'Executive ministry workspace'
        : 'Executive assignment workspace',
      title: this.getGreeting(),
      description: workspace.id === 'all'
        ? 'A clear view of what is scheduled, what is prepared and what needs a decision across your ministries.'
        : 'Everything requiring your attention across speaking invitations, assignments, preparation and ministry follow-up.',
      todayLabel: new Intl.DateTimeFormat(
        'en-US',
        {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }
      ).format(new Date()),
      metrics,
      schedule: this.buildSchedule(
        pendingInvitationReviews,
        careCasesWaiting,
        activeAssignments,
        upcomingAssignments
      ),
      activities: this.buildActivities(
        assignments,
        requests,
        careEnabled
      ),
      quickActions: this.buildQuickActions(careEnabled),
      nextEvent: upcomingAssignments[0] ?? null
    };
  }

  private buildSchedule(
    invitationReviews: readonly SpeakingRequest[],
    careCases: readonly MinistryResponse[],
    activeAssignments: readonly Assignment[],
    upcomingAssignments: readonly Assignment[]
  ): DashboardScheduleItem[] {
    const items: DashboardScheduleItem[] = [];

    if (invitationReviews[0]) {
      items.push({
        time: '9:30 AM',
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

    if (items.length < 4 && upcomingAssignments[0]) {
      items.push({
        time: '2:00 PM',
        title: 'Assignment preparation review',
        description:
          `${upcomingAssignments[0].eventName} · ${upcomingAssignments[0].readinessPercentage}% prepared`,
        tone: 'navy',
        route:
          `/app/assignments/${upcomingAssignments[0].id}/overview`
      });
    }

    return items.slice(0, 4);
  }

  private buildActivities(
    assignments: readonly Assignment[],
    requests: readonly SpeakingRequest[],
    careEnabled: boolean
  ): DashboardActivity[] {
    const assignmentActivities = assignments.flatMap(
      assignment => (assignment.activityLog?.items ?? []).flatMap(
        activity => {
          const mapped = this.fromAssignmentActivity(
            assignment,
            activity,
            careEnabled
          );
          return mapped ? [mapped] : [];
        }
      )
    );
    const requestActivities = requests.flatMap(
      request => (request.communications ?? []).map(
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
    activity: AssignmentActivityItem,
    careEnabled: boolean
  ): DashboardActivity | null {
    if (activity.section === 'travel') {
      return null;
    }

    if (
      !careEnabled &&
      ['responses', 'follow-up'].includes(activity.section)
    ) {
      return null;
    }

    const sectionRoutes: Partial<Record<
      AssignmentActivityItem['section'],
      string
    >> = {
      overview: 'overview',
      checklist: 'checklist',
      contacts: 'contacts',
      documents: 'documents',
      responses: 'care-network',
      'follow-up': 'care-network'
    };
    const sectionRoute = sectionRoutes[activity.section];
    if (!sectionRoute) {
      return null;
    }

    return {
      id:
        `assignment-${assignment.id}-activity-${activity.id}`,
      title: activity.title,
      description: activity.description,
      context: assignment.eventName,
      createdUtc: activity.createdUtc,
      tone: activity.tone === 'success'
        ? 'green'
        : activity.tone === 'attention'
          ? 'amber'
          : 'blue',
      route:
        `/app/assignments/${assignment.id}/${sectionRoute}`
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
      tone: communication.type === 'approved'
        ? 'green'
        : communication.type === 'host-responded' ||
            communication.type === 'submitted'
          ? 'violet'
          : 'blue',
      route: `/app/speaking-requests/${request.id}`
    };
  }

  private buildQuickActions(
    careEnabled: boolean
  ): DashboardQuickAction[] {
    const actions: DashboardQuickAction[] = [
      {
        label: 'Review invitations',
        description: 'Open the host invitation queue',
        icon: 'review',
        route: '/app/speaking-requests',
        emphasis: true
      },
      {
        label: 'Open assignments',
        description: 'Review preparation and ownership',
        icon: 'assignment',
        route: '/app/assignments'
      }
    ];

    if (careEnabled) {
      actions.push({
        label: 'Open Care Inbox',
        description: 'Review follow-ups and referrals',
        icon: 'care',
        route: '/app/care-network'
      });
    }

    actions.push({
      label: 'Speaker profile',
      description: 'Review approved ministry assets',
      icon: 'profile',
      route: '/app/speaker-profile'
    });

    return actions;
  }

  private getMostUrgentTask(
    assignments: readonly Assignment[]
  ): AssignmentTaskContext | null {
    const tasks = assignments.flatMap(
      assignment => (assignment.stages ?? []).flatMap(
        stage => stage.tasks
          .filter(task => task.status !== 'complete')
          .map(task => ({ assignment, stage, task }))
      )
    );

    return tasks.sort((left, right) => {
      if (left.task.status === 'blocked' && right.task.status !== 'blocked') {
        return -1;
      }
      if (right.task.status === 'blocked' && left.task.status !== 'blocked') {
        return 1;
      }
      return this.parseDateOnly(left.task.dueDate).getTime() -
        this.parseDateOnly(right.task.dueDate).getTime();
    })[0] ?? null;
  }

  private isCareCaseWaiting(
    response: MinistryResponse
  ): boolean {
    return [
      'needs-review',
      'ready-to-refer',
      'referred'
    ].includes(response.status);
  }

  private getAverageReadiness(
    assignments: readonly Assignment[]
  ): number {
    if (assignments.length === 0) {
      return 0;
    }

    return Math.round(
      assignments.reduce(
        (total, assignment) =>
          total + assignment.readinessPercentage,
        0
      ) / assignments.length
    );
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning, Michael.';
    }
    if (hour < 18) {
      return 'Good afternoon, Michael.';
    }
    return 'Good evening, Michael.';
  }

  private formatShortDate(value: string): string {
    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }
    ).format(this.parseDateOnly(value));
  }

  private isInCurrentMonth(value: string): boolean {
    const date = this.parseDateOnly(value);
    const now = new Date();
    return date.getUTCFullYear() === now.getFullYear() &&
      date.getUTCMonth() === now.getMonth();
  }

  private getDaysUntilDate(value: string): number {
    const today = new Date();
    const startOfToday = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const target = this.parseDateOnly(value).getTime();
    return Math.ceil(
      (target - startOfToday) / 86_400_000
    );
  }

  private parseDateOnly(value: string): Date {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? new Date(8_640_000_000_000_000)
      : parsed;
  }
}
