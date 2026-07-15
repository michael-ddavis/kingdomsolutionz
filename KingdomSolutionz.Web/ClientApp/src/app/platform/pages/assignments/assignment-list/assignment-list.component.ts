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

type JourneyFilter =
  | 'all'
  | 'active'
  | 'completed'
  | 'cancelled';

@Component({
  selector: 'app-assignment-list',
  templateUrl:
    './assignment-list.component.html',
  styleUrls: [
    './assignment-list.component.scss'
  ]
})
export class AssignmentListComponent {
  selectedFilter: JourneyFilter = 'all';

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

  setFilter(filter: JourneyFilter): void {
    this.selectedFilter = filter;
  }

  getFilteredJourneys(
    assignments: readonly Assignment[]
  ): readonly Assignment[] {
    if (this.selectedFilter === 'all') {
      return assignments;
    }

    return assignments.filter(
      journey =>
        journey.status === this.selectedFilter
    );
  }

  countByStatus(
    assignments: readonly Assignment[],
    status: JourneyFilter
  ): number {
    if (status === 'all') {
      return assignments.length;
    }

    return assignments.filter(
      journey => journey.status === status
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
        (total, journey) =>
          total + journey.readinessPercentage,
        0
      );

    return Math.round(
      totalReadiness / assignments.length
    );
  }

  getApproachingEventCount(
    assignments: readonly Assignment[]
  ): number {
    return assignments.filter(journey => {
      const daysUntilEvent =
        this.getDaysUntilEvent(journey);

      return (
        journey.status === 'active' &&
        daysUntilEvent >= 0 &&
        daysUntilEvent <= 30
      );
    }).length;
  }

  getTotalBlockedTasks(
    assignments: readonly Assignment[]
  ): number {
    return assignments.reduce(
      (total, journey) =>
        total +
        journey.stages.reduce(
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
    journey: Assignment
  ): AssignmentStage | undefined {
    return (
      journey.stages.find(
        stage =>
          stage.status === 'blocked'
      ) ??
      journey.stages.find(
        stage =>
          stage.status === 'current'
      ) ??
      journey.stages[
      journey.stages.length - 1
      ]
    );
  }

  getCompletedTaskCount(
    journey: Assignment
  ): number {
    return journey.stages.reduce(
      (total, stage) =>
        total +
        stage.tasks.filter(
          task => task.status === 'complete'
        ).length,
      0
    );
  }

  getTotalTaskCount(
    journey: Assignment
  ): number {
    return journey.stages.reduce(
      (total, stage) =>
        total + stage.tasks.length,
      0
    );
  }

  getBlockedTaskCount(
    journey: Assignment
  ): number {
    return journey.stages.reduce(
      (total, stage) =>
        total +
        stage.tasks.filter(
          task => task.status === 'blocked'
        ).length,
      0
    );
  }

  getNextDueTask(
    journey: Assignment
  ): AssignmentTask | undefined {
    const incompleteTasks =
      journey.stages
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
    journey: Assignment
  ): number {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(
      `${journey.startDate}T12:00:00`
    );

    const difference =
      eventDate.getTime() - today.getTime();

    return Math.ceil(
      difference / 86400000
    );
  }

  getEventTimingLabel(
    journey: Assignment
  ): string {
    const daysUntilEvent =
      this.getDaysUntilEvent(journey);

    if (journey.status === 'completed') {
      return 'Engagement completed';
    }

    if (journey.status === 'cancelled') {
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

  trackByJourneyId(
    index: number,
    journey: Assignment
  ): number {
    return journey.id;
  }
}