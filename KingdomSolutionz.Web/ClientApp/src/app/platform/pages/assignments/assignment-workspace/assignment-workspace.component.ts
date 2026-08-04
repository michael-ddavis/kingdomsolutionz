import {
  Component
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable,
  map,
  switchMap
} from 'rxjs';

import {
  Assignment
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';
import {
  ModuleEntitlementService
} from '../../../shared/services/module-entitlement.service';

interface AssignmentWorkspaceTab {
  label: string;
  route: string;
  description: string;
}

interface AssignmentWorkspaceTabGroup {
  id:
    | 'assignment'
    | 'preparation'
    | 'ministry'
    | 'record';
  label: string;
  tabs: AssignmentWorkspaceTab[];
}

@Component({
  standalone: false,
  selector: 'app-assignment-workspace',
  templateUrl:
    './assignment-workspace.component.html',
  styleUrls: [
    './assignment-workspace.component.scss'
  ]
})
export class AssignmentWorkspaceComponent {
  readonly assignment$:
    Observable<Assignment | undefined> =
    this.route.paramMap.pipe(
      map(params =>
        Number(params.get('id'))
      ),
      switchMap(assignmentId =>
        this.assignmentService.getAssignment(
          assignmentId
        )
      )
    );

  private readonly coreTabGroups:
    AssignmentWorkspaceTabGroup[] = [
      {
        id: 'assignment',
        label: 'Assignment',
        tabs: [
          {
            label: 'Overview',
            route: 'overview',
            description:
              'Executive assignment summary'
          }
        ]
      },
      {
        id: 'preparation',
        label: 'Preparation',
        tabs: [
          {
            label: 'Checklist',
            route: 'checklist',
            description:
              'Preparation responsibilities'
          },
          {
            label: 'Contacts',
            route: 'contacts',
            description:
              'Host and assignment contacts'
          },
          {
            label: 'Documents',
            route: 'documents',
            description:
              'Files, schedules and resources'
          }
        ]
      }
    ];

  readonly tabGroups$:
    Observable<AssignmentWorkspaceTabGroup[]> =
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
                  description:
                    'Responses, referrals and handoffs'
                }
              ]
            }
          ]
        : this.coreTabGroups
      )
    );

  readonly recordTabs:
    AssignmentWorkspaceTab[] = [
      {
        label: 'Closeout',
        route: 'closeout',
        description:
          'Outcomes, reconciliation and archive'
      },
      {
        label: 'Ministry Log',
        route: 'activity',
        description:
          'Updates, decisions and activity'
      }
    ];

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly assignmentService:
      AssignmentService,

    private readonly moduleEntitlements:
      ModuleEntitlementService
  ) { }

  getStatusLabel(
    assignment: Assignment
  ): string {
    switch (assignment.status) {
      case 'completed':
        return 'Assignment completed';

      case 'cancelled':
        return 'Assignment cancelled';

      case 'active':
      default:
        return 'Active assignment';
    }
  }
}
