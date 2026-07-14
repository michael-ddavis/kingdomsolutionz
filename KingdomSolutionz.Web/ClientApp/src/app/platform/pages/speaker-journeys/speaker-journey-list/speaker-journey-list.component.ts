import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SpeakerJourney,
  SpeakerJourneyStage,
  SpeakerJourneyTask
} from '../../../shared/models/speaker-journey.model';

import {
  SpeakerJourneyService
} from '../../../shared/services/speaker-journey.service';

type JourneyFilter =
  | 'all'
  | 'active'
  | 'completed'
  | 'cancelled';

@Component({
  selector: 'app-speaker-journey-list',
  templateUrl: './speaker-journey-list.component.html',
  styleUrls: ['./speaker-journey-list.component.scss']
})
export class SpeakerJourneyListComponent {
  selectedFilter: JourneyFilter = 'all';

  readonly journeys$: Observable<
    readonly SpeakerJourney[]
  > = this.speakerJourneyService
    .speakerJourneys$
    .pipe(
      map(journeys =>
        [...journeys].sort(
          (left, right) =>
            new Date(left.startDate).getTime() -
            new Date(right.startDate).getTime()
        )
      )
    );

  constructor(
    private readonly speakerJourneyService:
      SpeakerJourneyService
  ) {}

  setFilter(filter: JourneyFilter): void {
    this.selectedFilter = filter;
  }

  getFilteredJourneys(
    journeys: readonly SpeakerJourney[]
  ): readonly SpeakerJourney[] {
    if (this.selectedFilter === 'all') {
      return journeys;
    }

    return journeys.filter(
      journey =>
        journey.status === this.selectedFilter
    );
  }

  countByStatus(
    journeys: readonly SpeakerJourney[],
    status: JourneyFilter
  ): number {
    if (status === 'all') {
      return journeys.length;
    }

    return journeys.filter(
      journey => journey.status === status
    ).length;
  }

  getAverageReadiness(
    journeys: readonly SpeakerJourney[]
  ): number {
    if (journeys.length === 0) {
      return 0;
    }

    const totalReadiness =
      journeys.reduce(
        (total, journey) =>
          total + journey.readinessPercentage,
        0
      );

    return Math.round(
      totalReadiness / journeys.length
    );
  }

  getApproachingEventCount(
    journeys: readonly SpeakerJourney[]
  ): number {
    return journeys.filter(journey => {
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
    journeys: readonly SpeakerJourney[]
  ): number {
    return journeys.reduce(
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
    journey: SpeakerJourney
  ): SpeakerJourneyStage | undefined {
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
    journey: SpeakerJourney
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
    journey: SpeakerJourney
  ): number {
    return journey.stages.reduce(
      (total, stage) =>
        total + stage.tasks.length,
      0
    );
  }

  getBlockedTaskCount(
    journey: SpeakerJourney
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
    journey: SpeakerJourney
  ): SpeakerJourneyTask | undefined {
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
    journey: SpeakerJourney
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
    journey: SpeakerJourney
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
    journey: SpeakerJourney
  ): number {
    return journey.id;
  }
}