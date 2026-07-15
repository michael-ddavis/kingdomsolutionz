import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  SpeakerJourney
} from '../../../shared/models/speaker-journey.model';

import {
  SpeakerJourneyService
} from '../../../shared/services/speaker-journey.service';

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
    Observable<SpeakerJourney | undefined> =
      this.speakerJourneyService.getJourney(
        this.assignmentId
      );

  readonly tabs: AssignmentWorkspaceTab[] = [
    {
      label: 'Overview',
      route: 'overview',
      description: 'Executive assignment summary'
    },
    {
      label: 'Checklist',
      route: 'checklist',
      description: 'Preparation responsibilities'
    }
  ];

  constructor(
    private readonly route: ActivatedRoute,

    private readonly speakerJourneyService:
      SpeakerJourneyService
  ) {}

  getStatusLabel(
    assignment: SpeakerJourney
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