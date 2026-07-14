import { Component } from '@angular/core';
import { map } from 'rxjs/operators';

import {
  Workspace,
  WorkspaceId
} from '../../shared/models/workspace.model';
import { WorkspaceService } from '../../shared/services/workspace.service';

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

interface DashboardDefinition {
  eyebrow: string;
  title: string;
  description: string;
  metrics: DashboardMetric[];
  priorities: DashboardPriority[];
  activities: DashboardActivity[];
  workspaceOverviews?: WorkspaceOverview[];
}

interface DashboardViewModel extends DashboardDefinition {
  workspace: Workspace;
}

@Component({
  selector: 'app-platform-dashboard',
  templateUrl: './platform-dashboard.component.html',
  styleUrls: ['./platform-dashboard.component.scss']
})
export class PlatformDashboardComponent {
  private readonly dashboardDefinitions:
    Record<WorkspaceId, DashboardDefinition> = {
      all: {
        eyebrow: 'All Ministries',
        title: 'Good afternoon, Apostle Cynthia',
        description:
          'Here is what needs your attention across your connected ministries.',
        metrics: [
          {
            value: '7',
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
            value: '2',
            label: 'Invitations to review',
            detail: 'Awaiting a decision',
            tone: 'violet'
          },
          {
            value: '3',
            label: 'People may need care',
            detail: 'Follow-up recommended',
            tone: 'amber'
          }
        ],
        priorities: [
          {
            title: 'Review Richmond Worship Summit invitation',
            description:
              'The host church has provided the event schedule and travel coverage.',
            workspace: 'ACT Ministries',
            due: 'Due today',
            status: 'Awaiting review',
            tone: 'violet'
          },
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
        ],
        activities: [
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
            title: 'Speaking request received',
            description:
              'New invitation from Greater Hope Worship Center.',
            time: '3 hours ago',
            initials: 'GH'
          }
        ],
        workspaceOverviews: [
          {
            name: 'Apostle Cynthia Ministries',
            description:
              'Speaking, travel, events and ministry responses.',
            primaryMetric: '2',
            primaryLabel: 'Invitations',
            secondaryMetric: '1',
            secondaryLabel: 'Travel item',
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
      },

      'apostle-cynthia': {
        eyebrow: 'Itinerant Ministry',
        title: 'Apostle Cynthia Ministries',
        description:
          'Speaking engagements, travel preparation and ministry responses.',
        metrics: [
          {
            value: '2',
            label: 'Invitations to review',
            detail: 'One due today',
            tone: 'violet'
          },
          {
            value: '3',
            label: 'Upcoming engagements',
            detail: 'Next 30 days',
            tone: 'blue'
          },
          {
            value: '1',
            label: 'Travel item missing',
            detail: 'Transportation needed',
            tone: 'amber'
          },
          {
            value: '12',
            label: 'Recent responses',
            detail: 'Three awaiting handoff',
            tone: 'green'
          }
        ],
        priorities: [
          {
            title: 'Review Richmond Worship Summit invitation',
            description:
              'The host church has completed 87% of the event information.',
            workspace: 'Speaking Request',
            due: 'Due today',
            status: 'Awaiting review',
            tone: 'violet'
          },
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
        ],
        activities: [
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
        ]
      },

      jpp: {
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
      }
    };

  readonly viewModel$ =
    this.workspaceService.selectedWorkspace$.pipe(
      map(
        workspace =>
          ({
            workspace,
            ...this.dashboardDefinitions[workspace.id]
          }) as DashboardViewModel
      )
    );

  constructor(
    private readonly workspaceService: WorkspaceService
  ) {}
}