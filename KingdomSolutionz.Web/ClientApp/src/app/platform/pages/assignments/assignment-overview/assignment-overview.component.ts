import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  Assignment,
  AssignmentStage,
  AssignmentTask
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

@Component({
  standalone: false,
  selector: 'app-assignment-overview',
  templateUrl:
    './assignment-overview.component.html',
  styleUrls: [
    './assignment-overview.component.scss'
  ]
})
export class AssignmentOverviewComponent {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  constructor(
    private readonly route: ActivatedRoute,

    private readonly assignmentService:
      AssignmentService
  ) {}

  getTotalTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (total, stage) =>
        total + stage.tasks.length,
      0
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

  getCurrentStage(
    assignment: Assignment
  ): AssignmentStage | undefined {
    return (
      assignment.stages.find(
        stage => stage.status === 'blocked'
      ) ??
      assignment.stages.find(
        stage => stage.status === 'current'
      ) ??
      assignment.stages[
        assignment.stages.length - 1
      ]
    );
  }

  getNextTask(
    assignment: Assignment
  ): AssignmentTask | undefined {
    return assignment.stages
      .flatMap(stage => stage.tasks)
      .filter(
        task => task.status !== 'complete'
      )
      .sort(
        (left, right) =>
          this.parseDate(left.dueDate).getTime() -
          this.parseDate(right.dueDate).getTime()
      )[0];
  }

  getStageReadiness(
    stage: AssignmentStage
  ): number {
    if (stage.tasks.length === 0) {
      return 0;
    }

    const completedTasks =
      stage.tasks.filter(
        task => task.status === 'complete'
      ).length;

    return Math.round(
      (
        completedTasks /
        stage.tasks.length
      ) * 100
    );
  }

  getDaysUntilEvent(
    assignment: Assignment
  ): number {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const eventDate =
      this.parseDate(
        assignment.startDate
      );

    eventDate.setHours(0, 0, 0, 0);

    return Math.ceil(
      (
        eventDate.getTime() -
        today.getTime()
      ) / 86400000
    );
  }

  getEventTimingLabel(
    assignment: Assignment
  ): string {
    const daysUntilEvent =
      this.getDaysUntilEvent(assignment);

    if (daysUntilEvent < 0) {
      return 'Event date has passed';
    }

    if (daysUntilEvent === 0) {
      return 'Event is today';
    }

    if (daysUntilEvent === 1) {
      return 'Event is tomorrow';
    }

    return `${daysUntilEvent} days until event`;
  }

  private parseDate(
    isoDate: string
  ): Date {
    return new Date(
      `${isoDate}T12:00:00`
    );
  }
}