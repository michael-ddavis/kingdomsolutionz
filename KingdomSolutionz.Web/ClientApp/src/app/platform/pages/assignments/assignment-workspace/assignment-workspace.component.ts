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

interface AssignmentWorkspaceTab {
  label: string;
  route: string;
  description: string;
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

  readonly tabs:
    AssignmentWorkspaceTab[] = [
      {
        label: 'Overview',
        route: 'overview',
        description:
          'Executive assignment summary'
      },
      {
        label: 'Checklist',
        route: 'checklist',
        description:
          'Preparation responsibilities'
      },
      {
        label: 'Travel',
        route: 'travel',
        description:
          'Flights, lodging and transportation'
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
      },
      {
        label: 'Care Network',
        route: 'care-network',
        description:
          'Responses, referrals and handoffs'
      },
      {
        label: 'Ministry Log',
        route: 'activity',
        description:
          'Updates, decisions and activity'
      }
    ];

  travelQuickViewOpen = false;

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly assignmentService:
      AssignmentService
  ) { }

  openTravelQuickView(): void {
    this.travelQuickViewOpen = true;
  }

  closeTravelQuickView(): void {
    this.travelQuickViewOpen = false;
  }

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
