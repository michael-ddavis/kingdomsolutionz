import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SpeakingRequest
} from '../models/speaking-request.model';

import {
  SpeakerJourney,
  SpeakerJourneyStage,
  SpeakerJourneyTaskStatus
} from '../models/speaker-journey.model';

@Injectable({
  providedIn: 'root'
})
export class SpeakerJourneyService {
  private readonly journeysSubject =
    new BehaviorSubject<readonly SpeakerJourney[]>(
      [
        this.createSeededJourney()
      ]
    );

  readonly speakerJourneys$ =
    this.journeysSubject.asObservable();

  getJourney(
    journeyId: number
  ): Observable<SpeakerJourney | undefined> {
    return this.speakerJourneys$.pipe(
      map(journeys =>
        journeys.find(
          journey => journey.id === journeyId
        )
      )
    );
  }

  getJourneyBySpeakingRequest(
    speakingRequestId: number
  ): Observable<SpeakerJourney | undefined> {
    return this.speakerJourneys$.pipe(
      map(journeys =>
        journeys.find(
          journey =>
            journey.speakingRequestId ===
            speakingRequestId
        )
      )
    );
  }

  createOrGetJourney(
    request: SpeakingRequest
  ): SpeakerJourney {
    const existingJourney =
      this.journeysSubject.value.find(
        journey =>
          journey.speakingRequestId === request.id
      );

    if (existingJourney) {
      return existingJourney;
    }

    const nextId =
      Math.max(
        2000,
        ...this.journeysSubject.value.map(
          journey => journey.id
        )
      ) + 1;

    const newJourney =
      this.buildJourney(
        request,
        nextId
      );

    this.journeysSubject.next([
      newJourney,
      ...this.journeysSubject.value
    ]);

    return newJourney;
  }

  toggleTask(
    journeyId: number,
    stageId: string,
    taskId: number
  ): void {
    const updatedJourneys: SpeakerJourney[] =
      this.journeysSubject.value.map(journey => {
        if (journey.id !== journeyId) {
          return journey;
        }

        const updatedStages: SpeakerJourneyStage[] =
          journey.stages.map(stage => {
            if (stage.id !== stageId) {
              return stage;
            }

            return {
              ...stage,

              tasks: stage.tasks.map(task => {
                if (task.id !== taskId) {
                  return task;
                }

                const nextStatus:
                  SpeakerJourneyTaskStatus =
                  task.status === 'complete'
                    ? 'not-started'
                    : 'complete';

                return {
                  ...task,
                  status: nextStatus
                };
              })
            };
          });

        return this.recalculateJourney({
          ...journey,
          stages: updatedStages
        });
      });

    this.journeysSubject.next(updatedJourneys);
  }

  updateTaskStatus(
    journeyId: number,
    stageId: string,
    taskId: number,
    status: SpeakerJourneyTaskStatus
  ): void {
    const updatedJourneys: SpeakerJourney[] =
      this.journeysSubject.value.map(journey => {
        if (journey.id !== journeyId) {
          return journey;
        }

        const updatedStages: SpeakerJourneyStage[] =
          journey.stages.map(stage => {
            if (stage.id !== stageId) {
              return stage;
            }

            return {
              ...stage,

              tasks: stage.tasks.map(task =>
                task.id === taskId
                  ? {
                    ...task,
                    status
                  }
                  : task
              )
            };
          });

        return this.recalculateJourney({
          ...journey,
          stages: updatedStages
        });
      });

    this.journeysSubject.next(updatedJourneys);
  }

  private buildJourney(
    request: SpeakingRequest,
    journeyId: number
  ): SpeakerJourney {
    let taskId = journeyId * 100;

    const createTask = (
      title: string,
      description: string,
      owner: string,
      dueDate: string,
      status: SpeakerJourneyTaskStatus =
        'not-started'
    ) => ({
      id: ++taskId,
      title,
      description,
      owner,
      dueDate,
      status
    });

    const stages: SpeakerJourneyStage[] = [
      {
        id: 'invitation',
        name: 'Invitation',
        description:
          'Review the invitation and establish the ministry engagement.',
        status: 'complete',
        tasks: [
          createTask(
            'Approve speaking invitation',
            'The ministry invitation has been reviewed and approved.',
            'Apostle Cynthia',
            request.submittedUtc.slice(0, 10),
            'complete'
          ),
          createTask(
            'Confirm primary host contact',
            'Verify the person responsible for event coordination.',
            'Executive Assistant',
            this.shiftDate(
              request.startDate,
              -55
            ),
            'complete'
          )
        ]
      },
      {
        id: 'travel',
        name: 'Travel',
        description:
          'Coordinate transportation, lodging and the travel itinerary.',
        status: 'current',
        tasks: [
          createTask(
            'Confirm transportation',
            'Confirm airfare, mileage or other primary transportation.',
            'Executive Assistant',
            this.shiftDate(
              request.startDate,
              -45
            )
          ),
          createTask(
            'Confirm lodging',
            'Record hotel information and confirmation details.',
            'Executive Assistant',
            this.shiftDate(
              request.startDate,
              -40
            ),
            request.lodgingCovered
              ? 'in-progress'
              : 'not-started'
          ),
          createTask(
            'Confirm ground transportation',
            'Identify airport pickup and local transportation arrangements.',
            'Host Coordinator',
            this.shiftDate(
              request.startDate,
              -30
            )
          ),
          createTask(
            'Prepare final itinerary',
            'Combine travel, lodging, contacts and event schedule.',
            'Executive Assistant',
            this.shiftDate(
              request.startDate,
              -14
            )
          )
        ]
      },
      {
        id: 'promotion',
        name: 'Promotion',
        description:
          'Prepare approved biography, photography and promotional materials.',
        status: 'upcoming',
        tasks: [
          createTask(
            'Send approved media kit',
            'Provide biography, portrait and promotional requirements.',
            'Media Coordinator',
            this.shiftDate(
              request.startDate,
              -40
            )
          ),
          createTask(
            'Review promotional artwork',
            'Review the host ministry’s event graphics before publication.',
            'Media Coordinator',
            this.shiftDate(
              request.startDate,
              -30
            )
          ),
          createTask(
            'Confirm event promotion is live',
            'Verify the event page and promotional materials are published.',
            'Host Coordinator',
            this.shiftDate(
              request.startDate,
              -21
            )
          )
        ]
      },
      {
        id: 'preparation',
        name: 'Ministry Preparation',
        description:
          'Prepare spiritually and operationally for the ministry assignment.',
        status: 'upcoming',
        tasks: [
          createTask(
            'Receive ministry focus',
            'Confirm the host’s requested focus, audience and expected outcomes.',
            'Apostle Cynthia',
            this.shiftDate(
              request.startDate,
              -21
            )
          ),
          createTask(
            'Assign prayer coverage',
            'Assign intercessors to cover the engagement before and during ministry.',
            'Prayer Coordinator',
            this.shiftDate(
              request.startDate,
              -14
            )
          ),
          createTask(
            'Prepare response form and QR code',
            'Create the public prayer and discipleship response experience.',
            'Ministry Coordinator',
            this.shiftDate(
              request.startDate,
              -10
            )
          ),
          createTask(
            'Confirm ministry resources',
            'Prepare any books, downloads, curriculum or follow-up resources.',
            'Ministry Coordinator',
            this.shiftDate(
              request.startDate,
              -7
            )
          )
        ]
      },
      {
        id: 'event',
        name: 'Event',
        description:
          'Execute the engagement and capture ministry responses.',
        status: 'upcoming',
        tasks: [
          createTask(
            'Confirm final run of show',
            'Review arrival, sound check, ministry time and departure.',
            'Executive Assistant',
            this.shiftDate(
              request.startDate,
              -3
            )
          ),
          createTask(
            'Activate ministry response form',
            'Make the event response experience available to attendees.',
            'Ministry Coordinator',
            request.startDate
          ),
          createTask(
            'Record ministry outcomes',
            'Capture attendance, responses, prayer needs and key outcomes.',
            'Ministry Coordinator',
            request.endDate
          )
        ]
      },
      {
        id: 'follow-up',
        name: 'Follow-Up',
        description:
          'Complete media, host communication and discipleship handoffs.',
        status: 'upcoming',
        tasks: [
          createTask(
            'Thank the host ministry',
            'Send a personal thank-you and confirm any remaining items.',
            'Executive Assistant',
            this.shiftDate(
              request.endDate,
              1
            )
          ),
          createTask(
            'Review ministry responses',
            'Review prayer, salvation and discipleship responses.',
            'Discipleship Coordinator',
            this.shiftDate(
              request.endDate,
              2
            )
          ),
          createTask(
            'Complete ministry handoffs',
            'Connect people to JPP or trusted partner ministries.',
            'Discipleship Coordinator',
            this.shiftDate(
              request.endDate,
              5
            )
          ),
          createTask(
            'Receive approved media',
            'Collect approved event photography, video and testimony content.',
            'Media Coordinator',
            this.shiftDate(
              request.endDate,
              7
            )
          )
        ]
      }
    ];

    return this.recalculateJourney({
      id: journeyId,
      speakingRequestId: request.id,

      eventName: request.eventName,
      organizationName:
        request.organizationName,
      eventType: request.eventType,

      city: request.city,
      state: request.state,
      venueName: request.venueName,

      startDate: request.startDate,
      endDate: request.endDate,

      coordinator: {
        name: 'Michael Davis',
        role: 'Assignment Coordinator'
      },

      status: 'active',
      readinessPercentage: 0,

      createdUtc: new Date().toISOString(),
      stages
    });
  }

  private recalculateJourney(
    journey: SpeakerJourney
  ): SpeakerJourney {
    const totalTasks =
      journey.stages.reduce(
        (total, stage) =>
          total + stage.tasks.length,
        0
      );

    const completedTasks =
      journey.stages.reduce(
        (total, stage) =>
          total +
          stage.tasks.filter(
            task => task.status === 'complete'
          ).length,
        0
      );

    let currentStageFound = false;

    const updatedStages =
      journey.stages.map(stage => {
        const allTasksComplete =
          stage.tasks.length > 0 &&
          stage.tasks.every(
            task => task.status === 'complete'
          );

        const hasBlockedTask =
          stage.tasks.some(
            task => task.status === 'blocked'
          );

        if (allTasksComplete) {
          return {
            ...stage,
            status: 'complete' as const
          };
        }

        if (!currentStageFound) {
          currentStageFound = true;

          return {
            ...stage,
            status: hasBlockedTask
              ? 'blocked' as const
              : 'current' as const
          };
        }

        return {
          ...stage,
          status: 'upcoming' as const
        };
      });

    const readinessPercentage =
      totalTasks === 0
        ? 0
        : Math.round(
          (completedTasks / totalTasks) * 100
        );

    return {
      ...journey,
      status:
        completedTasks === totalTasks
          ? 'completed'
          : 'active',
      readinessPercentage,
      stages: updatedStages
    };
  }

  private shiftDate(
    isoDate: string,
    numberOfDays: number
  ): string {
    const date = new Date(
      `${isoDate}T12:00:00`
    );

    date.setDate(
      date.getDate() + numberOfDays
    );

    return date
      .toISOString()
      .slice(0, 10);
  }

  private createSeededJourney(): SpeakerJourney {
    const request: SpeakingRequest = {
      id: 1003,
      organizationName:
        'New Covenant Global Church',
      eventName:
        'Kingdom Leadership Intensive',
      eventType:
        'Leadership Intensive',

      contactName:
        'Bishop Aaron Williams',
      contactEmail:
        'aaron@newcovenantglobal.example',
      contactPhone:
        '(404) 555-0175',

      city: 'Atlanta',
      state: 'GA',
      venueName:
        'New Covenant Global Church',

      startDate: '2026-08-28',
      endDate: '2026-08-30',

      ministryRequest:
        'Two leadership sessions and Sunday morning ministry.',

      expectedAttendance: 275,

      travelCovered: true,
      lodgingCovered: true,
      honorariumProvided: true,

      readinessPercentage: 94,
      status: 'approved',

      submittedUtc:
        '2026-07-07T16:45:00Z'
    };

    const journey =
      this.buildJourney(
        request,
        2001
      );

    return journey;
  }
}