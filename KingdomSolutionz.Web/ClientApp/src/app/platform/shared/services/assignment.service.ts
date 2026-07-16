import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { SpeakingRequest } from '../models/speaking-request.model';
import {
  Assignment,
  AssignmentActivityItem,
  AssignmentActivityLog,
  AssignmentActivitySection,
  AssignmentActivityTone,
  AssignmentContact,
  AssignmentContactDirectory,
  AssignmentDocument,
  AssignmentDocumentCategory,
  AssignmentDocumentLibrary,
  AssignmentFlight,
  AssignmentGroundTransportation,
  AssignmentHotel,
  AssignmentStage,
  AssignmentTask,
  AssignmentTaskStatus,
  AssignmentTravelItinerary,
  AssignmentTaskComment
} from '../models/assignment.model';

interface NewAssignmentActivity {
  type?: AssignmentActivityItem['type'];
  tone: AssignmentActivityTone;
  title: string;
  description: string;
  actor: string;
  section: AssignmentActivitySection;
  createdUtc?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly assignmentsSubject =
    new BehaviorSubject<readonly Assignment[]>([
      this.createSeededAssignment()
    ]);

  readonly assignments$: Observable<readonly Assignment[]> =
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

  getAssignmentBySpeakingRequestId(
    speakingRequestId: number
  ): Observable<Assignment | undefined> {
    return this.assignments$.pipe(
      map(assignments =>
        assignments.find(
          assignment =>
            assignment.speakingRequestId === speakingRequestId
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

    const assignment = this.buildAssignment(
      request,
      this.getNextAssignmentId()
    );

    this.assignmentsSubject.next([
      ...this.assignmentsSubject.value,
      assignment
    ]);

    return assignment;
  }

  updateTaskStatus(
    assignmentId: number,
    stageId: string,
    taskId: number,
    status: AssignmentTaskStatus,
    actor = 'Michael Davis'
  ): void {
    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const stage = assignment.stages.find(
          item => item.id === stageId
        );

        const task = stage?.tasks.find(
          item => item.id === taskId
        );

        if (!stage || !task || task.status === status) {
          return assignment;
        }

        const updatedStages: AssignmentStage[] =
          assignment.stages.map(currentStage => {
            if (currentStage.id !== stageId) {
              return currentStage;
            }

            return {
              ...currentStage,
              tasks: currentStage.tasks.map(currentTask =>
                currentTask.id === taskId
                  ? {
                    ...currentTask,
                    status
                  }
                  : currentTask
              )
            };
          });

        const recalculatedAssignment =
          this.recalculateAssignment({
            ...assignment,
            stages: updatedStages
          });

        return this.appendActivity(
          recalculatedAssignment,
          {
            type: 'task-updated',
            tone:
              status === 'blocked'
                ? 'attention'
                : status === 'complete'
                  ? 'success'
                  : 'neutral',
            title:
              status === 'complete'
                ? 'Checklist item completed'
                : status === 'blocked'
                  ? 'Checklist item blocked'
                  : 'Checklist item updated',
            description:
              `"${task.title}" was changed to ${this.getTaskStatusLabel(status)}.`,
            actor,
            section: 'checklist'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  toggleTask(
    assignmentId: number,
    stageId: string,
    taskOrId: AssignmentTask | number,
    actor = 'Michael Davis'
  ): void {
    const assignment =
      this.assignmentsSubject.value.find(
        item => item.id === assignmentId
      );

    if (!assignment) {
      return;
    }

    const stage = assignment.stages.find(
      item => item.id === stageId
    );

    if (!stage) {
      return;
    }

    const taskId =
      typeof taskOrId === 'number'
        ? taskOrId
        : taskOrId.id;

    const task = stage.tasks.find(
      item => item.id === taskId
    );

    if (!task) {
      return;
    }

    const nextStatus: AssignmentTaskStatus =
      task.status === 'complete'
        ? 'not-started'
        : 'complete';

    this.updateTaskStatus(
      assignmentId,
      stageId,
      taskId,
      nextStatus,
      actor
    );
  }

  addTaskComment(
    assignmentId: number,
    stageId: string,
    taskId: number,
    message: string,
    author = 'Michael Davis'
  ): void {
    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      return;
    }

    const createdUtc =
      new Date().toISOString();

    const updatedAssignments:
      Assignment[] =
      this.assignmentsSubject.value.map(
        assignment => {
          if (
            assignment.id !==
            assignmentId
          ) {
            return assignment;
          }

          const targetStage =
            assignment.stages.find(
              stage =>
                stage.id === stageId
            );

          const targetTask =
            targetStage?.tasks.find(
              task =>
                task.id === taskId
            );

          if (
            !targetStage ||
            !targetTask
          ) {
            return assignment;
          }

          const comment:
            AssignmentTaskComment = {
            id:
              this.getNextTaskCommentId(
                assignment
              ),

            author,

            message:
              trimmedMessage,

            createdUtc
          };

          const updatedStages:
            AssignmentStage[] =
            assignment.stages.map(
              stage => {
                if (
                  stage.id !==
                  stageId
                ) {
                  return stage;
                }

                return {
                  ...stage,

                  tasks:
                    stage.tasks.map(
                      task => {
                        if (
                          task.id !==
                          taskId
                        ) {
                          return task;
                        }

                        return {
                          ...task,

                          comments: [
                            ...(
                              task.comments ??
                              []
                            ),

                            comment
                          ]
                        };
                      }
                    )
                };
              }
            );

          const assignmentWithComment:
            Assignment = {
            ...assignment,
            stages:
              updatedStages
          };

          return this.appendActivity(
            assignmentWithComment,
            {
              type:
                'comment-added',

              tone:
                'neutral',

              title:
                'Checklist comment added',

              description:
                `Comment added to "${targetTask.title}": ${trimmedMessage}`,

              actor:
                author,

              section:
                'checklist',

              createdUtc
            }
          );
        }
      );

    this.assignmentsSubject.next(
      updatedAssignments
    );
  }

  updateTravelItinerary(
    assignmentId: number,
    itinerary: AssignmentTravelItinerary,
    actor = 'Michael Davis'
  ): void {
    const updatedItinerary: AssignmentTravelItinerary = {
      ...itinerary,
      readinessPercentage:
        this.calculateTravelReadiness(itinerary),
      lastUpdatedUtc: new Date().toISOString()
    };

    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const assignmentWithTravel: Assignment = {
          ...assignment,
          travelItinerary: updatedItinerary
        };

        const assignmentWithChecklist =
          this.syncTravelChecklist(
            assignmentWithTravel
          );

        const recalculatedAssignment =
          this.recalculateAssignment(
            assignmentWithChecklist
          );

        return this.appendActivity(
          recalculatedAssignment,
          {
            type: 'travel-updated',
            tone:
              updatedItinerary.readinessPercentage === 100
                ? 'success'
                : 'neutral',
            title: 'Travel itinerary updated',
            description:
              updatedItinerary.readinessPercentage === 100
                ? 'All required travel arrangements are complete.'
                : `Travel readiness is now ${updatedItinerary.readinessPercentage}%.`,
            actor,
            section: 'travel'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  updateContactDirectory(
    assignmentId: number,
    directory: AssignmentContactDirectory,
    actor = 'Michael Davis'
  ): void {
    const updatedDirectory: AssignmentContactDirectory = {
      ...directory,
      readinessPercentage:
        this.calculateContactReadiness(directory),
      lastUpdatedUtc: new Date().toISOString()
    };

    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const assignmentWithContacts: Assignment = {
          ...assignment,
          contactDirectory: updatedDirectory
        };

        const assignmentWithChecklist =
          this.syncContactChecklist(
            assignmentWithContacts
          );

        const recalculatedAssignment =
          this.recalculateAssignment(
            assignmentWithChecklist
          );

        return this.appendActivity(
          recalculatedAssignment,
          {
            type: 'contacts-updated',
            tone:
              updatedDirectory.readinessPercentage === 100
                ? 'success'
                : 'neutral',
            title: 'Assignment contacts updated',
            description:
              updatedDirectory.readinessPercentage === 100
                ? 'All required assignment contacts are available.'
                : `Contact readiness is now ${updatedDirectory.readinessPercentage}%.`,
            actor,
            section: 'contacts'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  addDocument(
    assignmentId: number,
    document: Omit<
      AssignmentDocument,
      'id' | 'uploadedUtc'
    >
  ): void {
    const uploadedDocument: AssignmentDocument = {
      ...document,
      id: this.getNextDocumentId(),
      uploadedUtc: new Date().toISOString()
    };

    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const documents = [
          ...assignment.documentLibrary.documents,
          uploadedDocument
        ];

        const documentLibrary: AssignmentDocumentLibrary = {
          documents,
          readinessPercentage:
            this.calculateDocumentReadiness(documents),
          lastUpdatedUtc: new Date().toISOString()
        };

        const assignmentWithDocuments: Assignment = {
          ...assignment,
          documentLibrary
        };

        const assignmentWithChecklist =
          this.syncDocumentChecklist(
            assignmentWithDocuments
          );

        const recalculatedAssignment =
          this.recalculateAssignment(
            assignmentWithChecklist
          );

        return this.appendActivity(
          recalculatedAssignment,
          {
            type: 'document-uploaded',
            tone: 'success',
            title: 'Document uploaded',
            description:
              `"${uploadedDocument.title}" was added to the assignment document library.`,
            actor: uploadedDocument.uploadedBy,
            section: 'documents'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  removeDocument(
    assignmentId: number,
    documentId: number,
    actor = 'Michael Davis'
  ): void {
    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const removedDocument =
          assignment.documentLibrary.documents.find(
            document => document.id === documentId
          );

        if (!removedDocument) {
          return assignment;
        }

        const documents =
          assignment.documentLibrary.documents.filter(
            document => document.id !== documentId
          );

        const documentLibrary: AssignmentDocumentLibrary = {
          documents,
          readinessPercentage:
            this.calculateDocumentReadiness(documents),
          lastUpdatedUtc: new Date().toISOString()
        };

        const assignmentWithDocuments: Assignment = {
          ...assignment,
          documentLibrary
        };

        const assignmentWithChecklist =
          this.syncDocumentChecklist(
            assignmentWithDocuments
          );

        const recalculatedAssignment =
          this.recalculateAssignment(
            assignmentWithChecklist
          );

        return this.appendActivity(
          recalculatedAssignment,
          {
            type: 'document-removed',
            tone: 'attention',
            title: 'Document removed',
            description:
              `"${removedDocument.title}" was removed from the assignment document library.`,
            actor,
            section: 'documents'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  addActivityNote(
    assignmentId: number,
    message: string,
    tone: AssignmentActivityTone = 'neutral',
    actor = 'Michael Davis'
  ): void {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        return this.appendActivity(
          assignment,
          {
            type: 'note-added',
            tone,
            title:
              tone === 'attention'
                ? 'Attention needed'
                : tone === 'success'
                  ? 'Ministry update completed'
                  : 'Ministry update',
            description: trimmedMessage,
            actor,
            section: 'overview'
          }
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  addCareReferralActivity(
    assignmentId: number,
    activity: {
      type:
        | 'referral-sent'
        | 'referral-viewed'
        | 'referral-accepted'
        | 'referral-declined'
        | 'person-connected';
      tone: AssignmentActivityTone;
      title: string;
      description: string;
      actor: string;
      section:
        | 'responses'
        | 'follow-up';
    }
  ): void {
    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        return this.appendActivity(
          assignment,
          activity
        );
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  resetCareReferralActivity(
    assignmentId: number
  ): void {
    const referralActivityTypes:
      AssignmentActivityItem['type'][] = [
        'referral-sent',
        'referral-viewed',
        'referral-accepted',
        'referral-declined',
        'person-connected'
      ];

    const updatedAssignments: Assignment[] =
      this.assignmentsSubject.value.map(assignment => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const items =
          assignment.activityLog.items.filter(
            item =>
              !referralActivityTypes.includes(
                item.type
              )
          );

        return {
          ...assignment,
          activityLog: {
            items,
            lastUpdatedUtc:
              items.length === 0
                ? null
                : items[
                  items.length - 1
                ].createdUtc
          }
        };
      });

    this.assignmentsSubject.next(updatedAssignments);
  }

  private buildAssignment(
    request: SpeakingRequest,
    assignmentId: number
  ): Assignment {
    const startDate = request.startDate;
    const endDate =
      request.endDate || request.startDate;

    const stages = this.buildAssignmentStages(
      startDate,
      endDate
    );

    const createdUtc = new Date().toISOString();

    return this.recalculateAssignment({
      id: assignmentId,
      speakingRequestId: request.id,
      eventName: request.eventName,
      organizationName: request.organizationName,
      eventType: request.eventType,
      city: request.city,
      state: request.state,
      venueName: request.venueName,
      startDate,
      endDate,
      coordinator: {
        name: 'Michael Davis',
        role: 'Assignment Coordinator'
      },
      contactDirectory:
        this.createEmptyContactDirectory(),
      travelItinerary:
        this.createEmptyTravelItinerary(),
      documentLibrary:
        this.createEmptyDocumentLibrary(),
      activityLog:
        this.createInitialActivityLog(
          createdUtc
        ),
      status: 'active',
      readinessPercentage: 0,
      createdUtc,
      stages
    });
  }

  private buildAssignmentStages(
    startDate: string,
    endDate: string
  ): AssignmentStage[] {
    return [
      {
        id: 'approval',
        name: 'Invitation and Approval',
        description:
          'Confirm the invitation, assignment scope and internal ownership.',
        status: 'complete',
        tasks: [
          {
            id: 1,
            title: 'Review invitation details',
            description:
              'Verify the host ministry, event dates, location and requested ministry responsibilities.',
            owner: 'Executive Assistant',
            dueDate: this.shiftDate(startDate, -60),
            status: 'complete'
          },
          {
            id: 2,
            title: 'Confirm assignment scope',
            description:
              'Confirm the ministry expectations, session responsibilities and event purpose.',
            owner: 'Apostle Cynthia',
            dueDate: this.shiftDate(startDate, -58),
            status: 'complete'
          },
          {
            id: 3,
            title: 'Assign coordinator',
            description:
              'Name the person responsible for moving the assignment through preparation.',
            owner: 'Apostle Cynthia',
            dueDate: this.shiftDate(startDate, -56),
            status: 'complete'
          }
        ]
      },
      {
        id: 'travel',
        name: 'Travel Preparation',
        description:
          'Confirm flights, lodging, ground transportation and the final itinerary.',
        status: 'current',
        tasks: [
          {
            id: 4,
            title: 'Confirm transportation',
            description:
              'Record the outbound and return flight arrangements.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -35),
            status: 'not-started'
          },
          {
            id: 5,
            title: 'Confirm lodging',
            description:
              'Record the hotel reservation, confirmation and stay dates.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -32),
            status: 'not-started'
          },
          {
            id: 6,
            title: 'Confirm ground transportation',
            description:
              'Confirm arrival pickup, local transportation and departure pickup.',
            owner: 'Host Coordinator',
            dueDate: this.shiftDate(startDate, -21),
            status: 'not-started'
          },
          {
            id: 7,
            title: 'Prepare final itinerary',
            description:
              'Complete and verify the travel itinerary for the assignment team.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -14),
            status: 'not-started'
          }
        ]
      },
      {
        id: 'host-readiness',
        name: 'Host Readiness',
        description:
          'Confirm the venue, schedule, contacts and local assignment details.',
        status: 'upcoming',
        tasks: [
          {
            id: 8,
            title: 'Confirm venue information',
            description:
              'Verify the venue name, physical address and arrival instructions.',
            owner: 'Host Coordinator',
            dueDate: this.shiftDate(startDate, -28),
            status: 'not-started'
          },
          {
            id: 9,
            title: 'Confirm event schedule',
            description:
              'Record service times, sessions, rehearsals, meals and host meetings.',
            owner: 'Host Coordinator',
            dueDate: this.shiftDate(startDate, -21),
            status: 'not-started'
          },
          {
            id: 10,
            title: 'Confirm local contacts',
            description:
              'Confirm the host, assistant, media, transportation and emergency contacts.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -18),
            status: 'not-started'
          }
        ]
      },
      {
        id: 'promotion',
        name: 'Promotion and Materials',
        description:
          'Prepare approved promotional material and event-response resources.',
        status: 'upcoming',
        tasks: [
          {
            id: 11,
            title: 'Receive promotional requirements',
            description:
              'Confirm the host’s graphics, biography, photo and announcement requirements.',
            owner: 'Media Coordinator',
            dueDate: this.shiftDate(startDate, -35),
            status: 'not-started'
          },
          {
            id: 12,
            title: 'Deliver approved assets',
            description:
              'Send approved photos, biography, ministry information and promotional assets.',
            owner: 'Media Coordinator',
            dueDate: this.shiftDate(startDate, -28),
            status: 'not-started'
          },
          {
            id: 13,
            title: 'Confirm response resources',
            description:
              'Confirm the event response link, QR code and placement instructions.',
            owner: 'Media Coordinator',
            dueDate: this.shiftDate(startDate, -10),
            status: 'not-started'
          }
        ]
      },
      {
        id: 'prayer-preparation',
        name: 'Prayer and Preparation',
        description:
          'Prepare spiritually and operationally for the ministry assignment.',
        status: 'upcoming',
        tasks: [
          {
            id: 14,
            title: 'Gather host prayer focus',
            description:
              'Record the host ministry’s prayer focus, needs and desired outcomes.',
            owner: 'Prayer Coordinator',
            dueDate: this.shiftDate(startDate, -14),
            status: 'not-started'
          },
          {
            id: 15,
            title: 'Assign prayer support',
            description:
              'Confirm who will cover the assignment in prayer before and during the event.',
            owner: 'Prayer Coordinator',
            dueDate: this.shiftDate(startDate, -10),
            status: 'not-started'
          },
          {
            id: 16,
            title: 'Complete preparation call',
            description:
              'Complete the final preparation conversation with the host ministry.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -7),
            status: 'not-started'
          }
        ]
      },
      {
        id: 'ministry-event',
        name: 'Ministry Event',
        description:
          'Support the assignment and capture ministry responses and outcomes.',
        status: 'upcoming',
        tasks: [
          {
            id: 17,
            title: 'Confirm event-day schedule',
            description:
              'Verify the final event-day schedule and assignment responsibilities.',
            owner: 'Assignment Coordinator',
            dueDate: this.shiftDate(startDate, -1),
            status: 'not-started'
          },
          {
            id: 18,
            title: 'Record ministry responses',
            description:
              'Capture prayer, discipleship and follow-up responses from the event.',
            owner: 'Response Team',
            dueDate: endDate,
            status: 'not-started'
          }
        ]
      },
      {
        id: 'follow-up',
        name: 'Follow-Up',
        description:
          'Review responses, complete handoffs and record meaningful outcomes.',
        status: 'upcoming',
        tasks: [
          {
            id: 19,
            title: 'Review ministry responses',
            description:
              'Review every event response and identify the appropriate next step.',
            owner: 'Follow-Up Coordinator',
            dueDate: this.shiftDate(endDate, 1),
            status: 'not-started'
          },
          {
            id: 20,
            title: 'Complete ministry handoffs',
            description:
              'Assign accepted follow-up responsibilities to the appropriate ministry or leader.',
            owner: 'Follow-Up Coordinator',
            dueDate: this.shiftDate(endDate, 3),
            status: 'not-started'
          },
          {
            id: 21,
            title: 'Record outcomes and testimonies',
            description:
              'Document completed follow-up, ministry outcomes and testimonies.',
            owner: 'Follow-Up Coordinator',
            dueDate: this.shiftDate(endDate, 14),
            status: 'not-started'
          }
        ]
      }
    ];
  }

  private recalculateAssignment(
    assignment: Assignment
  ): Assignment {
    const allTasks =
      assignment.stages.flatMap(
        stage => stage.tasks
      );

    const completedTaskCount =
      allTasks.filter(
        task => task.status === 'complete'
      ).length;

    const readinessPercentage =
      allTasks.length === 0
        ? 0
        : Math.round(
          (
            completedTaskCount /
            allTasks.length
          ) * 100
        );

    let currentStageAssigned = false;

    const updatedStages: AssignmentStage[] =
      assignment.stages.map(stage => {
        const allComplete =
          stage.tasks.length > 0 &&
          stage.tasks.every(
            task => task.status === 'complete'
          );

        const hasBlockedTask =
          stage.tasks.some(
            task => task.status === 'blocked'
          );

        if (allComplete) {
          return {
            ...stage,
            status: 'complete'
          };
        }

        if (hasBlockedTask) {
          currentStageAssigned = true;

          return {
            ...stage,
            status: 'blocked'
          };
        }

        if (!currentStageAssigned) {
          currentStageAssigned = true;

          return {
            ...stage,
            status: 'current'
          };
        }

        return {
          ...stage,
          status: 'upcoming'
        };
      });

    const allAssignmentsComplete =
      allTasks.length > 0 &&
      completedTaskCount === allTasks.length;

    return {
      ...assignment,
      status:
        assignment.status === 'cancelled'
          ? 'cancelled'
          : allAssignmentsComplete
            ? 'completed'
            : 'active',
      readinessPercentage,
      stages: updatedStages
    };
  }

  private createEmptyTravelItinerary():
    AssignmentTravelItinerary {
    return {
      outboundFlight: {
        type: 'outbound',
        airline: '',
        flightNumber: '',
        confirmationNumber: '',
        departureAirport: '',
        arrivalAirport: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
        seat: '',
        notes: ''
      },
      returnFlight: {
        type: 'return',
        airline: '',
        flightNumber: '',
        confirmationNumber: '',
        departureAirport: '',
        arrivalAirport: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
        seat: '',
        notes: ''
      },
      hotel: {
        hotelName: '',
        confirmationNumber: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        checkInDate: '',
        checkInTime: '',
        checkOutDate: '',
        checkOutTime: '',
        phone: '',
        notes: ''
      },
      groundTransportation: {
        arrivalPickupContact: '',
        arrivalPickupPhone: '',
        arrivalPickupInstructions: '',
        localTransportationDetails: '',
        departurePickupContact: '',
        departurePickupPhone: '',
        departurePickupInstructions: ''
      },
      generalNotes: '',
      readinessPercentage: 0,
      lastUpdatedUtc: null
    };
  }

  private calculateTravelReadiness(
    itinerary: AssignmentTravelItinerary
  ): number {
    const readinessChecks = [
      this.isFlightComplete(
        itinerary.outboundFlight
      ),
      this.isFlightComplete(
        itinerary.returnFlight
      ),
      this.isHotelComplete(
        itinerary.hotel
      ),
      this.isArrivalTransportationComplete(
        itinerary.groundTransportation
      ),
      this.isDepartureTransportationComplete(
        itinerary.groundTransportation
      )
    ];

    const completedChecks =
      readinessChecks.filter(Boolean).length;

    return Math.round(
      (
        completedChecks /
        readinessChecks.length
      ) * 100
    );
  }

  private isFlightComplete(
    flight: AssignmentFlight
  ): boolean {
    return Boolean(
      flight.airline.trim() &&
      flight.flightNumber.trim() &&
      flight.confirmationNumber.trim() &&
      flight.departureAirport.trim() &&
      flight.arrivalAirport.trim() &&
      flight.departureDate &&
      flight.departureTime &&
      flight.arrivalDate &&
      flight.arrivalTime
    );
  }

  private hasFlightInformation(
    flight: AssignmentFlight
  ): boolean {
    return Boolean(
      flight.airline.trim() ||
      flight.flightNumber.trim() ||
      flight.confirmationNumber.trim() ||
      flight.departureAirport.trim() ||
      flight.arrivalAirport.trim() ||
      flight.departureDate ||
      flight.departureTime ||
      flight.arrivalDate ||
      flight.arrivalTime ||
      flight.seat.trim() ||
      flight.notes.trim()
    );
  }

  private isHotelComplete(
    hotel: AssignmentHotel
  ): boolean {
    return Boolean(
      hotel.hotelName.trim() &&
      hotel.confirmationNumber.trim() &&
      hotel.address.trim() &&
      hotel.city.trim() &&
      hotel.state.trim() &&
      hotel.checkInDate &&
      hotel.checkOutDate
    );
  }

  private hasHotelInformation(
    hotel: AssignmentHotel
  ): boolean {
    return Boolean(
      hotel.hotelName.trim() ||
      hotel.confirmationNumber.trim() ||
      hotel.address.trim() ||
      hotel.city.trim() ||
      hotel.state.trim() ||
      hotel.postalCode.trim() ||
      hotel.checkInDate ||
      hotel.checkInTime ||
      hotel.checkOutDate ||
      hotel.checkOutTime ||
      hotel.phone.trim() ||
      hotel.notes.trim()
    );
  }

  private isArrivalTransportationComplete(
    transportation:
      AssignmentGroundTransportation
  ): boolean {
    return Boolean(
      transportation.arrivalPickupContact.trim() &&
      transportation.arrivalPickupPhone.trim() &&
      transportation.arrivalPickupInstructions.trim()
    );
  }

  private isDepartureTransportationComplete(
    transportation:
      AssignmentGroundTransportation
  ): boolean {
    return Boolean(
      transportation.departurePickupContact.trim() &&
      transportation.departurePickupPhone.trim() &&
      transportation.departurePickupInstructions.trim()
    );
  }

  private hasGroundTransportationInformation(
    transportation:
      AssignmentGroundTransportation
  ): boolean {
    return Boolean(
      transportation.arrivalPickupContact.trim() ||
      transportation.arrivalPickupPhone.trim() ||
      transportation.arrivalPickupInstructions.trim() ||
      transportation.localTransportationDetails.trim() ||
      transportation.departurePickupContact.trim() ||
      transportation.departurePickupPhone.trim() ||
      transportation.departurePickupInstructions.trim()
    );
  }

  private syncTravelChecklist(
    assignment: Assignment
  ): Assignment {
    const itinerary = assignment.travelItinerary;

    const flightsComplete =
      this.isFlightComplete(
        itinerary.outboundFlight
      ) &&
      this.isFlightComplete(
        itinerary.returnFlight
      );

    const hotelComplete =
      this.isHotelComplete(
        itinerary.hotel
      );

    const groundTransportationComplete =
      this.isArrivalTransportationComplete(
        itinerary.groundTransportation
      ) &&
      this.isDepartureTransportationComplete(
        itinerary.groundTransportation
      );

    const finalItineraryComplete =
      flightsComplete &&
      hotelComplete &&
      groundTransportationComplete;

    const hasFlightInformation =
      this.hasFlightInformation(
        itinerary.outboundFlight
      ) ||
      this.hasFlightInformation(
        itinerary.returnFlight
      );

    const hasHotelInformation =
      this.hasHotelInformation(
        itinerary.hotel
      );

    const hasGroundInformation =
      this.hasGroundTransportationInformation(
        itinerary.groundTransportation
      );

    const hasAnyTravelInformation =
      hasFlightInformation ||
      hasHotelInformation ||
      hasGroundInformation;

    const determineStatus = (
      complete: boolean,
      started: boolean
    ): AssignmentTaskStatus => {
      if (complete) {
        return 'complete';
      }

      return started
        ? 'in-progress'
        : 'not-started';
    };

    const updatedStages: AssignmentStage[] =
      assignment.stages.map(stage => {
        if (stage.id !== 'travel') {
          return stage;
        }

        return {
          ...stage,
          tasks: stage.tasks.map(task => {
            let status: AssignmentTaskStatus =
              task.status;

            switch (task.title) {
              case 'Confirm transportation':
                status = determineStatus(
                  flightsComplete,
                  hasFlightInformation
                );
                break;

              case 'Confirm lodging':
                status = determineStatus(
                  hotelComplete,
                  hasHotelInformation
                );
                break;

              case 'Confirm ground transportation':
                status = determineStatus(
                  groundTransportationComplete,
                  hasGroundInformation
                );
                break;

              case 'Prepare final itinerary':
                status = determineStatus(
                  finalItineraryComplete,
                  hasAnyTravelInformation
                );
                break;
            }

            return {
              ...task,
              status
            };
          })
        };
      });

    return {
      ...assignment,
      stages: updatedStages
    };
  }

  private createEmptyContactDirectory():
    AssignmentContactDirectory {
    return {
      hostPastor:
        this.createEmptyContact(
          'host-pastor'
        ),
      hostCoordinator:
        this.createEmptyContact(
          'host-coordinator'
        ),
      travelContact:
        this.createEmptyContact(
          'travel'
        ),
      mediaContact:
        this.createEmptyContact(
          'media'
        ),
      emergencyContact:
        this.createEmptyContact(
          'emergency'
        ),
      readinessPercentage: 0,
      lastUpdatedUtc: null
    };
  }

  private createEmptyContact(
    category:
      AssignmentContact['category']
  ): AssignmentContact {
    return {
      category,
      name: '',
      role: '',
      organization: '',
      phone: '',
      email: '',
      preferredContactMethod: '',
      notes: ''
    };
  }

  private calculateContactReadiness(
    directory:
      AssignmentContactDirectory
  ): number {
    const contacts = [
      directory.hostPastor,
      directory.hostCoordinator,
      directory.travelContact,
      directory.mediaContact,
      directory.emergencyContact
    ];

    const completedContacts =
      contacts.filter(contact =>
        this.isContactComplete(contact)
      ).length;

    return Math.round(
      (
        completedContacts /
        contacts.length
      ) * 100
    );
  }

  private isContactComplete(
    contact: AssignmentContact
  ): boolean {
    return Boolean(
      contact.name.trim() &&
      (
        contact.phone.trim() ||
        contact.email.trim()
      )
    );
  }

  private hasContactInformation(
    contact: AssignmentContact
  ): boolean {
    return Boolean(
      contact.name.trim() ||
      contact.role.trim() ||
      contact.organization.trim() ||
      contact.phone.trim() ||
      contact.email.trim() ||
      contact.preferredContactMethod ||
      contact.notes.trim()
    );
  }

  private syncContactChecklist(
    assignment: Assignment
  ): Assignment {
    const directory =
      assignment.contactDirectory;

    const contacts = [
      directory.hostPastor,
      directory.hostCoordinator,
      directory.travelContact,
      directory.mediaContact,
      directory.emergencyContact
    ];

    const allContactsComplete =
      contacts.every(contact =>
        this.isContactComplete(contact)
      );

    const hasAnyContactInformation =
      contacts.some(contact =>
        this.hasContactInformation(contact)
      );

    const contactTaskStatus:
      AssignmentTaskStatus =
      allContactsComplete
        ? 'complete'
        : hasAnyContactInformation
          ? 'in-progress'
          : 'not-started';

    const updatedStages: AssignmentStage[] =
      assignment.stages.map(stage => {
        if (stage.id !== 'host-readiness') {
          return stage;
        }

        return {
          ...stage,
          tasks: stage.tasks.map(task =>
            task.title === 'Confirm local contacts'
              ? {
                ...task,
                status: contactTaskStatus
              }
              : task
          )
        };
      });

    return {
      ...assignment,
      stages: updatedStages
    };
  }

  private createEmptyDocumentLibrary():
    AssignmentDocumentLibrary {
    return {
      documents: [],
      readinessPercentage: 0,
      lastUpdatedUtc: null
    };
  }

  private calculateDocumentReadiness(
    documents:
      readonly AssignmentDocument[]
  ): number {
    const requiredCategories:
      AssignmentDocumentCategory[] = [
        'contract',
        'event-schedule',
        'travel-confirmation',
        'promotional-asset',
        'response-resource',
        'host-packet'
      ];

    const completedCategories =
      requiredCategories.filter(category =>
        documents.some(
          document =>
            document.category === category
        )
      ).length;

    return Math.round(
      (
        completedCategories /
        requiredCategories.length
      ) * 100
    );
  }

  private hasDocumentCategory(
    assignment: Assignment,
    category:
      AssignmentDocumentCategory
  ): boolean {
    return assignment.documentLibrary.documents.some(
      document =>
        document.category === category
    );
  }

  private syncDocumentChecklist(
    assignment: Assignment
  ): Assignment {
    const eventScheduleComplete =
      this.hasDocumentCategory(
        assignment,
        'event-schedule'
      );

    const promotionalAssetsComplete =
      this.hasDocumentCategory(
        assignment,
        'promotional-asset'
      );

    const responseResourcesComplete =
      this.hasDocumentCategory(
        assignment,
        'response-resource'
      );

    const updatedStages: AssignmentStage[] =
      assignment.stages.map(stage => ({
        ...stage,
        tasks: stage.tasks.map(task => {
          if (
            task.title ===
            'Confirm event schedule'
          ) {
            const status:
              AssignmentTaskStatus =
              eventScheduleComplete
                ? 'complete'
                : 'not-started';

            return {
              ...task,
              status
            };
          }

          if (
            task.title ===
            'Deliver approved assets'
          ) {
            const status:
              AssignmentTaskStatus =
              promotionalAssetsComplete
                ? 'complete'
                : 'not-started';

            return {
              ...task,
              status
            };
          }

          if (
            task.title ===
            'Confirm response resources'
          ) {
            const status:
              AssignmentTaskStatus =
              responseResourcesComplete
                ? 'complete'
                : 'not-started';

            return {
              ...task,
              status
            };
          }

          return task;
        })
      }));

    return {
      ...assignment,
      stages: updatedStages
    };
  }

  private createInitialActivityLog(
    createdUtc: string
  ): AssignmentActivityLog {
    return {
      items: [
        {
          id: 1,
          type: 'assignment-created',
          tone: 'success',
          title: 'Assignment created',
          description:
            'The ministry assignment was created from an approved host invitation.',
          actor: 'KingdomOS',
          createdUtc,
          section: 'overview'
        }
      ],
      lastUpdatedUtc: createdUtc
    };
  }

  private appendActivity(
    assignment: Assignment,
    activity: NewAssignmentActivity
  ): Assignment {
    const createdUtc =
      activity.createdUtc ??
      new Date().toISOString();

    const item: AssignmentActivityItem = {
      id: this.getNextActivityId(
        assignment
      ),
      type:
        activity.type ??
        this.resolveActivityType(
          activity.section,
          activity.title
        ),
      tone: activity.tone,
      title: activity.title,
      description: activity.description,
      actor: activity.actor,
      createdUtc,
      section: activity.section
    };

    return {
      ...assignment,
      activityLog: {
        items: [
          ...assignment.activityLog.items,
          item
        ],
        lastUpdatedUtc: createdUtc
      }
    };
  }

  private getNextActivityId(
    assignment: Assignment
  ): number {
    const activityIds =
      assignment.activityLog.items.map(
        item => item.id
      );

    return activityIds.length === 0
      ? 1
      : Math.max(...activityIds) + 1;
  }

  private getNextTaskCommentId(
    assignment: Assignment
  ): number {
    const commentIds =
      assignment.stages.flatMap(
        stage =>
          stage.tasks.flatMap(
            task =>
              (
                task.comments ??
                []
              ).map(
                comment =>
                  comment.id
              )
          )
      );

    if (
      commentIds.length === 0
    ) {
      return 1;
    }

    return Math.max(
      ...commentIds
    ) + 1;
  }

  private resolveActivityType(
    section: AssignmentActivitySection,
    title: string
  ): AssignmentActivityItem['type'] {
    if (title === 'Document uploaded') {
      return 'document-uploaded';
    }

    if (title === 'Document removed') {
      return 'document-removed';
    }

    switch (section) {
      case 'travel':
        return 'travel-updated';

      case 'contacts':
        return 'contacts-updated';

      case 'checklist':
        return 'task-updated';

      default:
        return 'note-added';
    }
  }

  private createSeededAssignment():
    Assignment {
    const startDate = '2026-08-28';
    const endDate = '2026-08-30';
    const createdUtc =
      '2026-07-14T14:00:00.000Z';

    const stages = this.buildAssignmentStages(
      startDate,
      endDate
    );

    return this.recalculateAssignment({
      id: 2001,
      speakingRequestId: 1003,
      eventName:
        'Kingdom Leadership Intensive',
      organizationName:
        'New Covenant Global Church',
      eventType:
        'Leadership Intensive',
      city: 'Atlanta',
      state: 'GA',
      venueName:
        'New Covenant Global Church',
      startDate,
      endDate,
      coordinator: {
        name: 'Michael Davis',
        role: 'Assignment Coordinator',
        email:
          'michael@kingdomsolutionz.com'
      },
      contactDirectory:
        this.createEmptyContactDirectory(),
      travelItinerary:
        this.createEmptyTravelItinerary(),
      documentLibrary:
        this.createEmptyDocumentLibrary(),
      activityLog:
        this.createInitialActivityLog(
          createdUtc
        ),
      status: 'active',
      readinessPercentage: 0,
      createdUtc,
      stages
    });
  }

  private getNextAssignmentId():
    number {
    const currentIds =
      this.assignmentsSubject.value.map(
        assignment => assignment.id
      );

    return currentIds.length === 0
      ? 2001
      : Math.max(...currentIds) + 1;
  }

  private getNextDocumentId():
    number {
    const documentIds =
      this.assignmentsSubject.value.flatMap(
        assignment =>
          assignment.documentLibrary.documents.map(
            document => document.id
          )
      );

    return documentIds.length === 0
      ? 1
      : Math.max(...documentIds) + 1;
  }

  private getTaskStatusLabel(
    status: AssignmentTaskStatus
  ): string {
    switch (status) {
      case 'complete':
        return 'Complete';

      case 'in-progress':
        return 'In progress';

      case 'blocked':
        return 'Blocked';

      case 'not-started':
      default:
        return 'Not started';
    }
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
}
