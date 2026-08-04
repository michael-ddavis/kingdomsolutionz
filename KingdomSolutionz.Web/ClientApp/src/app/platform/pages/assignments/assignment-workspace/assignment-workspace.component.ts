import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

import { Assignment } from '../../../shared/models/assignment.model';
import { AssignmentService } from '../../../shared/services/assignment.service';
import { ModuleEntitlementService } from '../../../shared/services/module-entitlement.service';

interface AssignmentWorkspaceTab {
  label: string;
  route: string;
  description: string;
}

interface AssignmentWorkspaceTabGroup {
  id: 'engagement' | 'coordination' | 'ministry';
  label: string;
  tabs: AssignmentWorkspaceTab[];
}

@Component({
  standalone: false,
  selector: 'app-assignment-workspace',
  templateUrl: './assignment-workspace.component.html',
  styleUrls: ['./assignment-workspace.component.scss']
})
export class AssignmentWorkspaceComponent {
  readonly assignment$: Observable<Assignment | undefined> =
    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap(assignmentId => this.assignmentService.getAssignment(assignmentId))
    );

  private readonly coreTabGroups: AssignmentWorkspaceTabGroup[] = [
    {
      id: 'engagement',
      label: 'Engagement',
      tabs: [
        {
          label: 'Overview',
          route: 'overview',
          description: 'Invitation, host, dates and engagement readiness'
        },
        {
          label: 'Checklist',
          route: 'checklist',
          description: 'Preparation responsibilities and blockers'
        }
      ]
    },
    {
      id: 'coordination',
      label: 'Coordination',
      tabs: [
        {
          label: 'Travel',
          route: 'travel',
          description: 'Flights, lodging and local transportation'
        },
        {
          label: 'Contacts',
          route: 'contacts',
          description: 'Host, venue, travel and emergency contacts'
        },
        {
          label: 'Documents',
          route: 'documents',
          description: 'Contracts, schedules, assets and host files'
        }
      ]
    }
  ];

  readonly tabGroups$: Observable<AssignmentWorkspaceTabGroup[]> =
    this.moduleEntitlements.isEnabled('care').pipe(
      map(careEnabled => careEnabled
        ? [
            ...this.coreTabGroups,
            {
              id: 'ministry' as const,
              label: 'Ministry',
              tabs: [
                {
                  label: 'Care Network',
                  route: 'care-network',
                  description: 'Consented responses, referrals and handoffs'
                }
              ]
            }
          ]
        : this.coreTabGroups
      )
    );

  readonly recordTabs: AssignmentWorkspaceTab[] = [
    {
      label: 'Closeout',
      route: 'closeout',
      description: 'Outcomes, expenses, reconciliation and archive'
    },
    {
      label: 'Engagement Log',
      route: 'activity',
      description: 'Updates, decisions and coordination history'
    }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly assignmentService: AssignmentService,
    private readonly moduleEntitlements: ModuleEntitlementService
  ) {}

  getStatusLabel(assignment: Assignment): string {
    switch (assignment.status) {
      case 'completed': return 'Engagement completed';
      case 'cancelled': return 'Engagement cancelled';
      case 'active':
      default: return 'Active engagement';
    }
  }
}
