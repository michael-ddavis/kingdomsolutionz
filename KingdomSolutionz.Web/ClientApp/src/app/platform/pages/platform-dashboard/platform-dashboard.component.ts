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
  Workspace
} from '../../shared/models/workspace.model';

import {
  SpeakingRequestService
} from '../../shared/services/speaking-request.service';

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

@Component({
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
      this.speakingRequestService.speakingRequests$
    ]).pipe(
      map(([workspace, speakingRequests]) =>
        this.buildDashboard(
          workspace,
          speakingRequests
        )
      )
    );

  constructor(
    private readonly workspaceService:
      WorkspaceService,

    private readonly speakingRequestService:
      SpeakingRequestService,

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
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardViewModel {
    switch (workspace.id) {
      case 'apostle-cynthia':
        return this.buildApostleCynthiaDashboard(
          workspace,
          speakingRequests
        );

      case 'jpp':
        return this.buildJppDashboard(workspace);

      case 'all':
      default:
        return this.buildAllMinistriesDashboard(
          workspace,
          speakingRequests
        );
    }
  }

  private buildAllMinistriesDashboard(
    workspace: Workspace,
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardViewModel {
    const orderedRequests =
      this.orderRequestsByNewest(speakingRequests);

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

    const requestPriorities =
      this.buildRequestPriorities(
        orderedRequests
      );

    const staticPriorities: DashboardPriority[] = [
      {
        title: 'Contact Marcus Johnson',
        description:
          'Marcus missed two group meetings and has not completed Week 3.',
        workspace: 'Jesus People Proclaim',
        due: 'Due tomorrow',
        status: 'Needs care',
        tone: 'amber'
      },
      {
        title: 'Accept two discipleship referrals',
        description:
          'Two conference responses are waiting for placement into a group.',
        workspace: 'Jesus People Proclaim',
        due: 'Waiting 1 day',
        status: 'Awaiting handoff',
        tone: 'blue'
      },
      {
        title: 'Confirm airport transportation',
        description:
          'Ground transportation is still missing for the Atlanta engagement.',
        workspace: 'ACT Ministries',
        due: 'Due Friday',
        status: 'Travel needed',
        tone: 'amber'
      }
    ];

    const priorities = [
      ...requestPriorities.slice(0, 2),
      ...staticPriorities
    ].slice(0, 5);

    const openPriorityCount =
      awaitingReview.length +
      informationNeeded.length +
      staticPriorities.length;

    return {
      workspace,
      eyebrow: 'All Ministries',
      title: 'Good afternoon, Apostle Cynthia',
      description:
        'Here is what needs your attention across your connected ministries.',

      metrics: [
        {
          value: openPriorityCount.toString(),
          label: 'Open priorities',
          detail: 'Across both ministries',
          tone: 'navy'
        },
        {
          value: '18',
          label: 'Active in discipleship',
          detail: 'Currently connected',
          tone: 'blue'
        },
        {
          value: awaitingReview.length.toString(),
          label: 'Invitations to review',
          detail:
            awaitingReview.length === 1
              ? 'One decision is needed'
              : 'Decisions are needed',
          tone: 'violet'
        },
        {
          value: '3',
          label: 'People may need care',
          detail: 'Follow-up recommended',
          tone: 'amber'
        }
      ],

      priorities,

      activities: this.buildCombinedActivities(
        orderedRequests
      ),

      workspaceOverviews: [
        {
          name: 'Apostle Cynthia Ministries',
          description:
            'Speaking, travel, events and ministry responses.',
          primaryMetric:
            awaitingReview.length.toString(),
          primaryLabel: 'To review',
          secondaryMetric:
            informationNeeded.length.toString(),
          secondaryLabel: 'Need information',
          tone: 'violet'
        },
        {
          name: 'Jesus People Proclaim',
          description:
            'Discipleship, groups, curriculum and care.',
          primaryMetric: '3',
          primaryLabel: 'Need care',
          secondaryMetric: '4',
          secondaryLabel: 'Lessons due',
          tone: 'blue'
        }
      ]
    };
  }

  private buildApostleCynthiaDashboard(
    workspace: Workspace,
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardViewModel {
    const orderedRequests =
      this.orderRequestsByNewest(speakingRequests);

    const awaitingReview =
      orderedRequests.filter(
        request =>
          request.status === 'awaiting-review'
      );

    const approved =
      orderedRequests.filter(
        request =>
          request.status === 'approved'
      );

    const informationNeeded =
      orderedRequests.filter(
        request =>
          request.status === 'information-needed'
      );

    const requestPriorities =
      this.buildRequestPriorities(
        orderedRequests
      );

    const staticPriorities: DashboardPriority[] = [
      {
        title: 'Confirm Atlanta ground transportation',
        description:
          'The host has confirmed the hotel but not airport pickup.',
        workspace: 'Travel',
        due: 'Due Friday',
        status: 'Information needed',
        tone: 'amber'
      },
      {
        title: 'Handoff three discipleship responses',
        description:
          'Responses from the Charlotte gathering need receiving ministries.',
        workspace: 'Ministry Responses',
        due: 'Waiting 2 days',
        status: 'Awaiting handoff',
        tone: 'blue'
      }
    ];

    return {
      workspace,
      eyebrow: 'Itinerant Ministry',
      title: 'Apostle Cynthia Ministries',
      description:
        'Speaking engagements, travel preparation and ministry responses.',

      metrics: [
        {
          value: speakingRequests.length.toString(),
          label: 'Speaking requests',
          detail: 'Currently in the system',
          tone: 'navy'
        },
        {
          value: awaitingReview.length.toString(),
          label: 'Awaiting review',
          detail:
            awaitingReview.length === 1
              ? 'One decision is needed'
              : 'Decisions are needed',
          tone: 'violet'
        },
        {
          value: approved.length.toString(),
          label: 'Approved engagements',
          detail: 'Moving toward readiness',
          tone: 'green'
        },
        {
          value: informationNeeded.length.toString(),
          label: 'Need information',
          detail: 'Waiting on host details',
          tone: 'amber'
        }
      ],

      priorities: [
        ...requestPriorities,
        ...staticPriorities
      ].slice(0, 5),

      activities:
        this.buildApostleCynthiaActivities(
          orderedRequests
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

        workspace: 'ACT Ministries',

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

  private buildCombinedActivities(
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardActivity[] {
    const requestActivity =
      this.buildLatestRequestActivity(
        speakingRequests
      );

    const activities: DashboardActivity[] = [];

    if (requestActivity) {
      activities.push(requestActivity);
    }

    activities.push(
      {
        title: 'Referral accepted',
        description:
          'Jasmine Lee was connected to JPP Online Discipleship.',
        time: '18 minutes ago',
        initials: 'JL'
      },
      {
        title: 'Lesson completed',
        description:
          'David Carter completed Foundations of Faith — Week 2.',
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
    );

    return activities.slice(0, 4);
  }

  private buildApostleCynthiaActivities(
    speakingRequests: readonly SpeakingRequest[]
  ): DashboardActivity[] {
    const requestActivity =
      this.buildLatestRequestActivity(
        speakingRequests
      );

    const activities: DashboardActivity[] = [];

    if (requestActivity) {
      activities.push(requestActivity);
    }

    activities.push(
      {
        title: 'Host readiness updated',
        description:
          'New Covenant Church uploaded the event schedule.',
        time: '32 minutes ago',
        initials: 'NC'
      },
      {
        title: 'Flight confirmed',
        description:
          'Travel to Atlanta is now marked confirmed.',
        time: '2 hours ago',
        initials: 'AT'
      },
      {
        title: 'Ministry response submitted',
        description:
          'A new discipleship request was received from Charlotte.',
        time: 'Yesterday',
        initials: 'CR'
      }
    );

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
      time: this.getSubmissionLabel(
        latestRequest.submittedUtc
      ),
      initials:
        this.getOrganizationInitials(
          latestRequest.organizationName
        )
    };
  }

  private orderRequestsByNewest(
    speakingRequests: readonly SpeakingRequest[]
  ): SpeakingRequest[] {
    return [...speakingRequests].sort(
      (left, right) =>
        new Date(right.submittedUtc).getTime() -
        new Date(left.submittedUtc).getTime()
    );
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
      return 'Submitted moments ago';
    }

    if (
      elapsedMinutes >= 1 &&
      elapsedMinutes < 60
    ) {
      return `Submitted ${elapsedMinutes} minutes ago`;
    }

    const elapsedHours =
      Math.floor(elapsedMinutes / 60);

    if (
      elapsedHours >= 1 &&
      elapsedHours < 24
    ) {
      return elapsedHours === 1
        ? 'Submitted 1 hour ago'
        : `Submitted ${elapsedHours} hours ago`;
    }

    return `Submitted ${new Date(
      submittedUtc
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    )}`;
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
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }
}