import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  Assignment,
  AssignmentStageStatus,
  AssignmentTask,
  AssignmentTaskStatus
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

@Component({
  selector: 'app-speaker-assignment-detail',
  templateUrl:
    './assignment-detail.component.html',
  styleUrls: [
    './assignment-detail.component.scss'
  ]
})
export class AssignmentDetailComponent {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  readonly assignment$:
    Observable<Assignment | undefined> =
    this.speakerAssignmentService.getAssignment(
      this.assignmentId
    );

  readonly stageLabels:
    Record<AssignmentStageStatus, string> = {
      complete: 'Complete',
      current: 'In progress',
      upcoming: 'Upcoming',
      blocked: 'Blocked'
    };

  readonly taskLabels:
    Record<AssignmentTaskStatus, string> = {
      'not-started': 'Not started',
      'in-progress': 'In progress',
      complete: 'Complete',
      blocked: 'Blocked'
    };

  constructor(
    private readonly route: ActivatedRoute,

    private readonly speakerAssignmentService:
      AssignmentService
  ) { }

  toggleTask(
    assignmentId: number,
    stageId: string,
    task: AssignmentTask
  ): void {
    this.speakerAssignmentService.toggleTask(
      assignmentId,
      stageId,
      task.id
    );
  }

  getCompletedTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (total, stage) =>
        total +
        stage.tasks.filter(
          task => task.status === 'complete'
        ).length,
      0
    );
  }

  getTotalTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (total, stage) =>
        total + stage.tasks.length,
      0
    );
  }

  getStageCompletedCount(
    assignment: Assignment
  ): number {
    return assignment.stages.filter(
      stage => stage.status === 'complete'
    ).length;
  }

  getCompletedStageTaskCount(
    stage: {
      tasks: AssignmentTask[];
    }
  ): number {
    return stage.tasks.filter(
      task => task.status === 'complete'
    ).length;
  }
}