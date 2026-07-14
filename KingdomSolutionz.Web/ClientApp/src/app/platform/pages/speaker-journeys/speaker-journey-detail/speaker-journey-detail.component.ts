import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import {
  SpeakerJourney,
  SpeakerJourneyStageStatus,
  SpeakerJourneyTask,
  SpeakerJourneyTaskStatus
} from '../../../shared/models/speaker-journey.model';

import {
  SpeakerJourneyService
} from '../../../shared/services/speaker-journey.service';

@Component({
  selector: 'app-speaker-journey-detail',
  templateUrl:
    './speaker-journey-detail.component.html',
  styleUrls: [
    './speaker-journey-detail.component.scss'
  ]
})
export class SpeakerJourneyDetailComponent {
  private readonly journeyId =
    Number(
      this.route.snapshot.paramMap.get('id')
    );

  readonly journey$:
    Observable<SpeakerJourney | undefined> =
    this.speakerJourneyService.getJourney(
      this.journeyId
    );

  readonly stageLabels:
    Record<SpeakerJourneyStageStatus, string> = {
      complete: 'Complete',
      current: 'In progress',
      upcoming: 'Upcoming',
      blocked: 'Blocked'
    };

  readonly taskLabels:
    Record<SpeakerJourneyTaskStatus, string> = {
      'not-started': 'Not started',
      'in-progress': 'In progress',
      complete: 'Complete',
      blocked: 'Blocked'
    };

  constructor(
    private readonly route: ActivatedRoute,

    private readonly speakerJourneyService:
      SpeakerJourneyService
  ) { }

  toggleTask(
    journeyId: number,
    stageId: string,
    task: SpeakerJourneyTask
  ): void {
    this.speakerJourneyService.toggleTask(
      journeyId,
      stageId,
      task.id
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

  getStageCompletedCount(
    journey: SpeakerJourney
  ): number {
    return journey.stages.filter(
      stage => stage.status === 'complete'
    ).length;
  }

  getCompletedStageTaskCount(
    stage: {
      tasks: SpeakerJourneyTask[];
    }
  ): number {
    return stage.tasks.filter(
      task => task.status === 'complete'
    ).length;
  }
}