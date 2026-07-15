import {
  Component
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable
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
  selector: 'app-assignment-workspace',
  templateUrl:
    './assignment-workspace.component.html',
  styleUrls: [
    './assignment-workspace.component.scss'
  ]
})
export class AssignmentWorkspaceComponent {
  private readonly assignmentId =
    Number(
      this.route.snapshot.paramMap.get('id')
    );

  readonly assignment$:
    Observable<Assignment | undefined> =
    this.assignmentService.getAssignment(
      this.assignmentId
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
      }
    ];

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly assignmentService:
      AssignmentService
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