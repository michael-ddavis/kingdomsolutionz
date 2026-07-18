import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  combineLatest,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SpeakingRequest,
  SpeakingRequestStatus
} from '../../shared/models/speaking-request.model';

import {
  Assignment,
  AssignmentStage,
  AssignmentTask
} from '../../shared/models/assignment.model';

import {
  CareNetworkState
} from '../../shared/models/care-referral.model';

import {
  Workspace
} from '../../shared/models/workspace.model';

import {
  SpeakingRequestService
} from '../../shared/services/speaking-request.service';

import {
  AssignmentService
} from '../../shared/services/assignment.service';

import {
  CareReferralService
} from '../../shared/services/care-referral.service';

import {
  WorkspaceService
} from '../../shared/services/workspace.service';

type MetricTone =
  | 'navy'
  | 'blue'
  | 'violet'
  | 'gold'
  | 'green'
  | 'amber';

type StatusTone =
  | 'blue'
  | 'violet'
  | 'green'
  | 'amber';

interface DashboardMetric {
  value: string;
  label: string;
  detail: string;
  tone: MetricTone;
}

interface DashboardPriority {
  title: string;
  description: string;
  workspace: string;
  due: string;
  status: string;
  tone: StatusTone;
  route?: string;
}

interface DashboardActivity {
  title: string;
  description: string;
  time: string;
  initials: string;
}

interface WorkspaceOverview {
  name: string;
  description: string;
  primaryMetric: string;
  primaryLabel: string;
  secondaryMetric: string;
  secondaryLabel: string;
  tone: 'violet' | 'blue';
}

interface DashboardViewModel {
  workspace: Workspace;
  eyebrow: string;
  title: string;
  description: string;
  metrics: DashboardMetric[];
  priorities: DashboardPriority[];
  activities: DashboardActivity[];
  workspaceOverviews?: WorkspaceOverview[];
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
  private readonly statusLabels:
    Record<SpeakingRequestStatus, string> = {
      'awaiting-review': 'Awaiting review',
      'information-needed': 'Information needed',
      approved: 'Approved',
      declined: 'Declined'
    };

  readonly viewModel$: Observable<DashboardViewModel> =
    combineLatest([
      this.workspaceService.selectedWorkspace$,
      this.speakingRequestService.speakingRequests$,
      this.assignmentService.assignments$,
      this.careReferralService.state$
    ]).pipe(
      map(
        ([
          workspace,
          speakingRequests,
          assignments,
          careNetwork
        ]) =>
          this.buildDashboard(
            workspace,
            speakingRequests,
            assignments,
            careNetwork
          )
      )
    );

  constructor(
    private readonly workspaceService:
      WorkspaceService,

    private readonly speakingRequestService:
      SpeakingRequestService,

    private readonly assignmentService:
      AssignmentService,

    private readonly careReferralService:
      CareReferralService,

    private readonly router: Router
  ) {}

  openPriority(
    priority: DashboardPriority
  ): void {
    if (!priority.route) {
      return;
    }

    this.router.navigateByUrl(priority.route);
  }

  private buildDashboard(
    workspace: Workspace,
    speakingRequests: readonly SpeakingRequest[],
    assignments: readonly Assignment[],
    careNetwork: CareNetworkState
  ): DashboardViewModel {
    switch (workspace.id) {
      case 'apostle-cynthia':
        return this.buildApostleCynthiaDashboard(
          workspace,
          speakingRequests,
          assignments
        );

      case 'jpp':
        return this.buildJppDashboard(workspace);

      case 'all':
      default:
        return this.buildAllMinistriesDashboard(
          workspace,
          speakingRequests,
          assignments,
          careNetwork
        );
    }
  }

  private buildAllMinistriesDashboard(
    workspace: Workspace,
    speakingRequests: readonly SpeakingRequest[],
    assignments: readonly Assignment[],
    careNetwork: CareNetworkState
  ): DashboardViewModel {
    const orderedRequests =
      this.orderRequestsByNewest(speakingRequests);

    const orderedAssignments =
      this.orderAssignmentsByEventDate(assignments);

    const awaitingReview =
      orderedRequests.filter(
        request =>
          request.status === 'awaiting-review'
      );

    const informationNeeded =
      orderedRequests.filter(
        request =>
          request.status === 'information-needed'
      );

    const activeAssignments =
      orderedAssignments.filter(
        assignment => assignment.status === 'active'
      );

    const assignmentAttentionCount =
      this.getAssignmentAttentionCount(
        activeAssignments
      );

    const openCareCases =
      careNetwork.responses.filter(response =>
        ![
          'connected',
          'unreachable',
          'withdrawn'
        ].includes(response.status)
      );

    const careAttentionCount =
      openCareCases.filter(response =>
        [
          'needs-review',
          'ready-to-refer'
        ].includes(response.status) ||
        Boolean(
          response.nextFollowUpUtc &&
          new Date(response.nextFollowUpUtc).getTime() <=
            Date.now()
        )
      ).length;

    const requestPriorities =
      this.buildRequestPriorities(
        orderedRequests
      );

    const assignmentPriorities =
      this.buildAssignmentPriorities(
        activeAssignments
      );

    const priorities = [
      ...requestPriorities.slice(0, 2),
      ...assignmentPriorities.slice(0, 3)
    ].slice(0, 5);

    const openPriorityCount =
      awaitingReview.length +
      informationNeeded.length +
      assignmentAttentionCount +
      careAttentionCount;

    return {
      workspace,
      eyebrow: 'All Ministries',
      title: 'Good afternoon, Cynthia Thompson',
      description:
        'Here is what needs your attention across your connected ministries.',

      metrics: [
        {
          value: openPriorityCount.toString(),
          label: 'Open priorities',
          detail: 'Across connected ministries',
          tone: 'navy'
        },
        {
          value: activeAssignments.length.toString(),
          label: 'Active engagements',
          detail: 'Speaking assignments underway',
          tone: 'violet'
        },
        {
          value: awaitingReview.length.toString(),
          label: 'Invitations to review',
          detail:
            awaitingReview.length === 1
              ? 'One decision is needed'
              : 'Decisions are needed',
          tone: 'blue'
        },
        {
          value:
            informationNeeded.length
              .toString(),
          label: 'Awaiting host details',
          detail: 'Information requests open',
          tone: 'amber'
        }
      ],

      priorities,

      activities: this.buildCombinedActivities(
        orderedRequests,
        orderedAssignments
      ),

      workspaceOverviews: [
        {
          name: 'Cynthia Thompson Global',
          description:
            'Speaking, travel, events and ministry responses.',
          primaryMetric:
            activeAssignments.length.toString(),
          primaryLabel: 'Active assignments',
          secondaryMetric:
            this.getAverageReadiness(
              activeAssignments
            ) + '%',
          secondaryLabel: 'Readiness',
          tone: 'violet'
        },
        {
          name: 'KingdomOps Care Network',
          description:
            'Consented responses, local referrals and accountable follow-up.',
          primaryMetric:
            openCareCases.length.toString(),
          primaryLabel: 'Open care cases',
          secondaryMetric:
            careNetwork.responses.filter(
              response =>
                response.status === 'connected'
            ).length.toString(),
          secondaryLabel: 'Connected',
          tone: 'blue'
        }
      ]
    };
  }

  private buildApostleCynthiaDashboard(
    workspace: Workspace,
    speakingRequests: readonly SpeakingRequest[],
    assignments: readonly Assignment[]
  ): DashboardViewModel {
    const orderedRequests =
      this.orderRequestsByNewest(speakingRequests);

    const orderedAssignments =
      this.orderAssignmentsByEventDate(assignments);

    const awaitingReview =
      orderedRequests.filter(
        request =>
          request.status === 'awaiting-review'
      );

    const informationNeeded =
      orderedRequests.filter(
        request =>
          request.status === 'information-needed'
      );

    const activeAssignments =
      orderedAssignments.filter(
        assignment => assignment.status === 'active'
      );

    const approachingEvents =
      activeAssignments.filter(
        assignment => {
          const daysUntilEvent =
            this.getDaysUntilEvent(assignment);

          return (
            daysUntilEvent >= 0 &&
            daysUntilEvent <= 30
          );
        }
      );

    const requestPriorities =
      this.buildRequestPriorities(
        orderedRequests
      );

    const assignmentPriorities =
      this.buildAssignmentPriorities(
        activeAssignments
      );

    return {
      workspace,
      eyebrow: 'Itinerant Ministry',
      title: 'Cynthia Thompson Global',
      description:
        'Speaking engagements, travel preparation and ministry responses.',

      metrics: [
        {
          value: activeAssignments.length.toString(),
          label: 'Active assignments',
          detail: 'Approved engagements underway',
          tone: 'navy'
        },
        {
          value:
            this.getAverageReadiness(
              activeAssignments
            ) + '%',
          label: 'Average readiness',
          detail: 'Across active engagements',
          tone: 'green'
        },
        {
          value: approachingEvents.length.toString(),
          label: 'Within 30 days',
          detail: 'Engagements approaching',
          tone: 'gold'
        },
        {
          value: awaitingReview.length.toString(),
          label: 'Awaiting review',
          detail:
            informationNeeded.length > 0
              ? `${informationNeeded.length} also need information`
              : 'Host decisions needed',
          tone: 'violet'
        }
      ],

      priorities: [
        ...requestPriorities,
        ...assignmentPriorities
      ].slice(0, 5),

      activities:
        this.buildApostleCynthiaActivities(
          orderedRequests,
          orderedAssignments
        )
    };
  }

  private buildJppDashboard(
    workspace: Workspace
  ): DashboardViewModel {
    return {
      workspace,
      eyebrow: 'Local Church',
      title: 'Jesus People Proclaim',
      description:
        'People, discipleship groups, curriculum progress and pastoral care.',

      metrics: [
        {
          value: '3',
          label: 'People may need care',
          detail: 'Leader action recommended',
          tone: 'amber'
        },
        {
          value: '18',
          label: 'Active group members',
          detail: 'Across three groups',
          tone: 'blue'
        },
        {
          value: '4',
          label: 'Lessons incomplete',
          detail: 'Make-up work assigned',
          tone: 'violet'
        },
        {
          value: '2',
          label: 'New referrals',
          detail: 'Awaiting placement',
          tone: 'green'
        }
      ],

      priorities: [
        {
          title: 'Contact Marcus Johnson',
          description:
            'Marcus missed two meetings and has not watched Week 3.',
          workspace: 'Young Men',
          due: 'Due tomorrow',
          status: 'Needs care',
          tone: 'amber'
        },
        {
          title: 'Place Jasmine Lee into a group',
          description:
            'Jasmine was referred after the Charlotte conference.',
          workspace: 'Discipleship Intake',
          due: 'Waiting 1 day',
          status: 'New referral',
          tone: 'blue'
        },
        {
          title: 'Review Week 5 curriculum',
          description:
            'Foundations of Faith Week 5 is ready for leader approval.',
          workspace: 'Curriculum',
          due: 'Due Friday',
          status: 'Awaiting review',
          tone: 'violet'
        }
      ],

      activities: [
        {
          title: 'Attendance recorded',
          description:
            'Young Adults Group recorded 9 of 12 members present.',
          time: '24 minutes ago',
          initials: 'YA'
        },
        {
          title: 'Make-up lesson completed',
          description:
            'David Carter completed the missed Week 2 lesson.',
          time: '1 hour ago',
          initials: 'DC'
        },
        {
          title: 'Leader follow-up recorded',
          description:
            'Sarah recorded a successful conversation with Tiana.',
          time: 'Yesterday',
          initials: 'TS'
        }
      ]
    };
  }

  private buildRequestPriorities(
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardPriority[] {
    return speakingRequests
      .filter(
        request =>
          request.status === 'awaiting-review' ||
          request.status === 'information-needed'
      )
      .map(request => ({
        title:
          request.status === 'information-needed'
            ? `Complete ${request.eventName} invitation`
            : `Review ${request.eventName} invitation`,

        description:
          request.status === 'information-needed'
            ? `${request.organizationName} still needs to provide additional host information.`
            : `${request.organizationName} submitted a speaking invitation for review.`,

        workspace: 'CTG',

        due: this.getSubmissionLabel(
          request.submittedUtc
        ),

        status:
          this.statusLabels[request.status],

        tone:
          request.status === 'information-needed'
            ? 'amber'
            : 'violet',

        route:
          `/app/speaking-requests/${request.id}`
      }));
  }

  private buildAssignmentPriorities(
    assignments: readonly Assignment[]
  ): DashboardPriority[] {
    const priorities: DashboardPriority[] = [];

    for (const assignment of assignments) {
      const blockedTask =
        this.getBlockedTask(assignment);

      if (blockedTask) {
        priorities.push({
          title:
            `Resolve ${blockedTask.task.title}`,
          description:
            `${assignment.eventName} · ${blockedTask.stage.name}`,
          workspace: 'Assignments',
          due: 'Blocked',
          status: 'Needs attention',
          tone: 'amber',
          route:
            `/app/assignments/${assignment.id}`
        });

        continue;
      }

      const nextTask =
        this.getNextIncompleteTask(assignment);

      if (!nextTask) {
        continue;
      }

      const daysUntilDue =
        this.getDaysUntilDate(
          nextTask.task.dueDate
        );

      priorities.push({
        title: nextTask.task.title,
        description:
          `${assignment.eventName} · ${nextTask.stage.name}`,
        workspace: 'Assignments',
        due:
          this.getTaskDueLabel(
            nextTask.task.dueDate
          ),
        status:
          daysUntilDue < 0
            ? 'Overdue'
            : 'Assignment task',
        tone:
          daysUntilDue <= 7
            ? 'amber'
            : 'blue',
        route:
          `/app/assignments/${assignment.id}`
      });
    }

    return priorities.sort(
      (left, right) => {
        if (left.due === 'Blocked') {
          return -1;
        }

        if (right.due === 'Blocked') {
          return 1;
        }

        return 0;
      }
    );
  }

  private getBlockedTask(
    assignment: Assignment
  ): AssignmentTaskContext | undefined {
    for (const stage of assignment.stages) {
      const task = stage.tasks.find(
        item => item.status === 'blocked'
      );

      if (task) {
        return {
          assignment,
          stage,
          task
        };
      }
    }

    return undefined;
  }

  private getNextIncompleteTask(
    assignment: Assignment
  ): AssignmentTaskContext | undefined {
    const contexts: AssignmentTaskContext[] = [];

    for (const stage of assignment.stages) {
      for (const task of stage.tasks) {
        if (task.status !== 'complete') {
          contexts.push({
            assignment,
            stage,
            task
          });
        }
      }
    }

    return contexts.sort(
      (left, right) =>
        this.parseDateOnly(
          left.task.dueDate
        ).getTime() -
        this.parseDateOnly(
          right.task.dueDate
        ).getTime()
    )[0];
  }

  private getAssignmentAttentionCount(
    assignments: readonly Assignment[]
  ): number {
    return assignments.filter(
      assignment => {
        const blocked =
          this.getBlockedTask(assignment);

        if (blocked) {
          return true;
        }

        const nextTask =
          this.getNextIncompleteTask(assignment);

        if (!nextTask) {
          return false;
        }

        return (
          this.getDaysUntilDate(
            nextTask.task.dueDate
          ) <= 7
        );
      }
    ).length;
  }

  private getAverageReadiness(
    assignments: readonly Assignment[]
  ): number {
    if (assignments.length === 0) {
      return 0;
    }

    const total =
      assignments.reduce(
        (sum, assignment) =>
          sum + assignment.readinessPercentage,
        0
      );

    return Math.round(
      total / assignments.length
    );
  }

  private buildCombinedActivities(
    speakingRequests: readonly SpeakingRequest[],
    assignments: readonly Assignment[]
  ): DashboardActivity[] {
    const activities: DashboardActivity[] = [];

    const requestActivity =
      this.buildLatestRequestActivity(
        speakingRequests
      );

    const assignmentActivity =
      this.buildLatestAssignmentActivity(
        assignments
      );

    if (requestActivity) {
      activities.push(requestActivity);
    }

    if (assignmentActivity) {
      activities.push(assignmentActivity);
    }

    return activities.slice(0, 4);
  }

  private buildApostleCynthiaActivities(
    speakingRequests: readonly SpeakingRequest[],
    assignments: readonly Assignment[]
  ): DashboardActivity[] {
    const activities: DashboardActivity[] = [];

    const requestActivity =
      this.buildLatestRequestActivity(
        speakingRequests
      );

    const assignmentActivity =
      this.buildLatestAssignmentActivity(
        assignments
      );

    if (requestActivity) {
      activities.push(requestActivity);
    }

    if (assignmentActivity) {
      activities.push(assignmentActivity);
    }

    return activities.slice(0, 4);
  }

  private buildLatestRequestActivity(
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardActivity | null {
    const latestRequest =
      speakingRequests[0];

    if (!latestRequest) {
      return null;
    }

    return {
      title: 'Speaking invitation received',
      description:
        `${latestRequest.eventName} — ${latestRequest.organizationName}`,
      time:
        this.getSubmissionLabel(
          latestRequest.submittedUtc
        ),
      initials:
        this.getOrganizationInitials(
          latestRequest.organizationName
        )
    };
  }

  private buildLatestAssignmentActivity(
    assignments: readonly Assignment[]
  ): DashboardActivity | null {
    const latestAssignment =
      [...assignments].sort(
        (left, right) =>
          new Date(
            right.createdUtc
          ).getTime() -
          new Date(
            left.createdUtc
          ).getTime()
      )[0];

    if (!latestAssignment) {
      return null;
    }

    return {
      title: 'Speaker assignment created',
      description:
        `${latestAssignment.eventName} is now in ministry preparation.`,
      time:
        this.getSubmissionLabel(
          latestAssignment.createdUtc
        ),
      initials:
        this.getOrganizationInitials(
          latestAssignment.organizationName
        )
    };
  }

  private orderRequestsByNewest(
    speakingRequests: readonly SpeakingRequest[]
  ): SpeakingRequest[] {
    return [...speakingRequests].sort(
      (left, right) =>
        new Date(
          right.submittedUtc
        ).getTime() -
        new Date(
          left.submittedUtc
        ).getTime()
    );
  }

  private orderAssignmentsByEventDate(
    assignments: readonly Assignment[]
  ): Assignment[] {
    return [...assignments].sort(
      (left, right) =>
        this.parseDateOnly(
          left.startDate
        ).getTime() -
        this.parseDateOnly(
          right.startDate
        ).getTime()
    );
  }

  private getDaysUntilEvent(
    assignment: Assignment
  ): number {
    return this.getDaysUntilDate(
      assignment.startDate
    );
  }

  private getDaysUntilDate(
    isoDate: string
  ): number {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const targetDate =
      this.parseDateOnly(isoDate);

    targetDate.setHours(0, 0, 0, 0);

    return Math.ceil(
      (
        targetDate.getTime() -
        today.getTime()
      ) / 86400000
    );
  }

  private getTaskDueLabel(
    dueDate: string
  ): string {
    const daysUntilDue =
      this.getDaysUntilDate(dueDate);

    if (daysUntilDue < 0) {
      const overdueDays =
        Math.abs(daysUntilDue);

      return overdueDays === 1
        ? 'Overdue by 1 day'
        : `Overdue by ${overdueDays} days`;
    }

    if (daysUntilDue === 0) {
      return 'Due today';
    }

    if (daysUntilDue === 1) {
      return 'Due tomorrow';
    }

    if (daysUntilDue <= 7) {
      return `Due in ${daysUntilDue} days`;
    }

    return `Due ${this.parseDateOnly(
      dueDate
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    )}`;
  }

  private getSubmissionLabel(
    submittedUtc: string
  ): string {
    const submittedTime =
      new Date(submittedUtc).getTime();

    const elapsedMilliseconds =
      Date.now() - submittedTime;

    const elapsedMinutes =
      Math.floor(
        elapsedMilliseconds / 60000
      );

    if (
      elapsedMinutes >= 0 &&
      elapsedMinutes < 1
    ) {
      return 'Moments ago';
    }

    if (
      elapsedMinutes >= 1 &&
      elapsedMinutes < 60
    ) {
      return `${elapsedMinutes} minutes ago`;
    }

    const elapsedHours =
      Math.floor(elapsedMinutes / 60);

    if (
      elapsedHours >= 1 &&
      elapsedHours < 24
    ) {
      return elapsedHours === 1
        ? '1 hour ago'
        : `${elapsedHours} hours ago`;
    }

    return new Date(
      submittedUtc
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );
  }

  private parseDateOnly(
    isoDate: string
  ): Date {
    return new Date(
      `${isoDate}T12:00:00`
    );
  }

  private getOrganizationInitials(
    organizationName: string
  ): string {
    const words =
      organizationName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
      return 'HM';
    }

    return words
      .slice(0, 2)
      .map(word =>
        word.charAt(0)
      )
      .join('')
      .toUpperCase();
  }
}
