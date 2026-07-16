import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Assignment,
  AssignmentStage,
  AssignmentTask
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

type AssignmentFilter =
  | 'all'
  | 'active'
  | 'completed'
  | 'cancelled';

@Component({
  standalone: false,
  selector: 'app-assignment-list',
  templateUrl:
    './assignment-list.component.html',
  styleUrls: [
    './assignment-list.component.scss'
  ]
})
export class AssignmentListComponent {
  selectedFilter: AssignmentFilter = 'all';

  readonly assignments$: Observable<
    readonly Assignment[]
  > = this.assignmentService
    .assignments$
    .pipe(
      map(assignments =>
        [...assignments].sort(
          (left, right) =>
            new Date(left.startDate).getTime() -
            new Date(right.startDate).getTime()
        )
      )
    );

  constructor(
    private readonly assignmentService:
      AssignmentService
  ) { }

  setFilter(filter: AssignmentFilter): void {
    this.selectedFilter = filter;
  }

  getFilteredAssignments(
    assignments: readonly Assignment[]
  ): readonly Assignment[] {
    if (this.selectedFilter === 'all') {
      return assignments;
    }

    return assignments.filter(
      assignment =>
        assignment.status === this.selectedFilter
    );
  }

  countByStatus(
    assignments: readonly Assignment[],
    status: AssignmentFilter
  ): number {
    if (status === 'all') {
      return assignments.length;
    }

    return assignments.filter(
      assignment => assignment.status === status
    ).length;
  }

  getAverageReadiness(
    assignments: readonly Assignment[]
  ): number {
    if (assignments.length === 0) {
      return 0;
    }

    const totalReadiness =
      assignments.reduce(
        (total, assignment) =>
          total + assignment.readinessPercentage,
        0
      );

    return Math.round(
      totalReadiness / assignments.length
    );
  }

  getApproachingEventCount(
    assignments: readonly Assignment[]
  ): number {
    return assignments.filter(assignment => {
      const daysUntilEvent =
        this.getDaysUntilEvent(assignment);

      return (
        assignment.status === 'active' &&
        daysUntilEvent >= 0 &&
        daysUntilEvent <= 30
      );
    }).length;
  }

  getTotalBlockedTasks(
    assignments: readonly Assignment[]
  ): number {
    return assignments.reduce(
      (total, assignment) =>
        total +
        assignment.stages.reduce(
          (stageTotal, stage) =>
            stageTotal +
            stage.tasks.filter(
              task => task.status === 'blocked'
            ).length,
          0
        ),
      0
    );
  }

  getCurrentStage(
    assignment: Assignment
  ): AssignmentStage | undefined {
    return (
      assignment.stages.find(
        stage =>
          stage.status === 'blocked'
      ) ??
      assignment.stages.find(
        stage =>
          stage.status === 'current'
      ) ??
      assignment.stages[
      assignment.stages.length - 1
      ]
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

  getBlockedTaskCount(
    assignment: Assignment
  ): number {
    return assignment.stages.reduce(
      (total, stage) =>
        total +
        stage.tasks.filter(
          task => task.status === 'blocked'
        ).length,
      0
    );
  }

  getNextDueTask(
    assignment: Assignment
  ): AssignmentTask | undefined {
    const incompleteTasks =
      assignment.stages
        .flatMap(stage => stage.tasks)
        .filter(
          task => task.status !== 'complete'
        )
        .sort(
          (left, right) =>
            new Date(left.dueDate).getTime() -
            new Date(right.dueDate).getTime()
        );

    return incompleteTasks[0];
  }

  getDaysUntilEvent(
    assignment: Assignment
  ): number {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(
      `${assignment.startDate}T12:00:00`
    );

    const difference =
      eventDate.getTime() - today.getTime();

    return Math.ceil(
      difference / 86400000
    );
  }

  getEventTimingLabel(
    assignment: Assignment
  ): string {
    const daysUntilEvent =
      this.getDaysUntilEvent(assignment);

    if (assignment.status === 'completed') {
      return 'Engagement completed';
    }

    if (assignment.status === 'cancelled') {
      return 'Engagement cancelled';
    }

    if (daysUntilEvent < 0) {
      return 'Event date passed';
    }

    if (daysUntilEvent === 0) {
      return 'Event is today';
    }

    if (daysUntilEvent === 1) {
      return 'Event is tomorrow';
    }

    return `${daysUntilEvent} days until event`;
  }

  trackByAssignmentId(
    index: number,
    assignment: Assignment
  ): number {
    return assignment.id;
  }
}
