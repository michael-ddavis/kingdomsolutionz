import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  map
} from 'rxjs';

import {
  SpeakingRequest
} from '../models/speaking-request.model';

import {
  Assignment,
  AssignmentStage,
  AssignmentTaskStatus
} from '../models/assignment.model';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly assignmentsSubject =
    new BehaviorSubject<readonly Assignment[]>(
      [
        this.createSeededAssignment()
      ]
    );

  readonly assignments$ =
    this.assignmentsSubject.asObservable();

  getAssignment(
    assignmentId: number
  ): Observable<Assignment | undefined> {
    return this.assignments$.pipe(
      map(assignments =>
        assignments.find(
          assignment => assignment.id === assignmentId
        )
      )
    );
  }

  getAssignmentBySpeakingRequest(
    speakingRequestId: number
  ): Observable<Assignment | undefined> {
    return this.assignments$.pipe(
      map(assignments =>
        assignments.find(
          assignment =>
            assignment.speakingRequestId ===
            speakingRequestId
        )
      )
    );
  }

  createOrGetAssignment(
    request: SpeakingRequest
  ): Assignment {
    const existingAssignment =
      this.assignmentsSubject.value.find(
        assignment =>
          assignment.speakingRequestId === request.id
      );

    if (existingAssignment) {
      return existingAssignment;
    }

    const nextId =
      Math.max(
        2000,
        ...this.assignmentsSubject.value.map(
          assignment => assignment.id
        )
      ) + 1;

    const newAssignment =
      this.buildAssignment(
        request,
        nextId
      );

    this.assignmentsSubject.next([
      newAssignment,
      ...this.assignmentsSubject.value
    ]);

    return newAssignment;
  }

  toggleTask(
    assignmentId: number,
    stageId: string,
    taskId: number
  ): void {
    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const updatedStages: AssignmentStage[] =
          assignment.stages.map(stage => {
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
                  AssignmentTaskStatus =
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

        return this.recalculateAssignment({
          ...assignment,
          stages: updatedStages
        });
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  updateTaskStatus(
    assignmentId: number,
    stageId: string,
    taskId: number,
    status: AssignmentTaskStatus
  ): void {
    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const updatedStages: AssignmentStage[] =
          assignment.stages.map(stage => {
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

        return this.recalculateAssignment({
          ...assignment,
          stages: updatedStages
        });
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  private buildAssignment(
    request: SpeakingRequest,
    assignmentId: number
  ): Assignment {
    let taskId = assignmentId * 100;

    const createTask = (
      title: string,
      description: string,
      owner: string,
      dueDate: string,
      status: AssignmentTaskStatus =
        'not-started'
    ) => ({
      id: ++taskId,
      title,
      description,
      owner,
      dueDate,
      status
    });

    const stages: AssignmentStage[] = [
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

    return this.recalculateAssignment({
      id: assignmentId,
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

  private recalculateAssignment(
    assignment: Assignment
  ): Assignment {
    const totalTasks =
      assignment.stages.reduce(
        (total, stage) =>
          total + stage.tasks.length,
        0
      );

    const completedTasks =
      assignment.stages.reduce(
        (total, stage) =>
          total +
          stage.tasks.filter(
            task => task.status === 'complete'
          ).length,
        0
      );

    let currentStageFound = false;

    const updatedStages =
      assignment.stages.map(stage => {
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
      ...assignment,
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

  private createSeededAssignment(): Assignment {
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

    const assignment =
      this.buildAssignment(
        request,
        2001
      );

    return assignment;
  }
}