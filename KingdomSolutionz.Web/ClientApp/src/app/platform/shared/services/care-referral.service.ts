import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  map
} from 'rxjs';

import {
  Assignment
} from '../models/assignment.model';

import {
  CareCasePriority,
  CareContactAttempt,
  CareContactMethod,
  CareContactOutcome,
  CareNetworkState,
  CarePartner,
  CareReferral,
  CareReferralContext,
  CreateCarePartnerInput,
  CreateMinistryResponseInput,
  MinistryResponse,
  MinistryResponseConsentSource
} from '../models/care-referral.model';

import {
  AssignmentService
} from './assignment.service';

@Injectable({
  providedIn: 'root'
})
export class CareReferralService {
  private readonly storageKey =
    'kingdomos-demo-care-network-v1';

  private readonly stateSubject =
    new BehaviorSubject<CareNetworkState>(
      this.loadState()
    );

  readonly state$ =
    this.stateSubject.asObservable();

  constructor(
    private readonly assignmentService:
      AssignmentService
  ) {}

  getAssignmentNetwork(
    assignmentId: number
  ): Observable<CareNetworkState> {
    return this.state$.pipe(
      map(state => ({
        partners: state.partners.filter(
          partner =>
            partner.assignmentId === assignmentId ||
            partner.assignmentId === null
        ),
        responses: state.responses.filter(
          response =>
            response.assignmentId === assignmentId
        ),
        referrals: state.referrals.filter(
          referral =>
            referral.assignmentId === assignmentId
        )
      }))
    );
  }

  getReferralContext(
    referralId: number
  ): Observable<CareReferralContext | undefined> {
    return this.state$.pipe(
      map(state => {
        const referral =
          state.referrals.find(
            item => item.id === referralId
          );

        if (!referral) {
          return undefined;
        }

        const response =
          state.responses.find(
            item =>
              item.id === referral.responseId
          );

        const partner =
          state.partners.find(
            item =>
              item.id === referral.partnerId
          );

        if (!response || !partner) {
          return undefined;
        }

        return {
          referral,
          response,
          partner
        };
      })
    );
  }

  ensureAssignmentNetwork(
    assignment: Assignment
  ): void {
    const state = this.stateSubject.value;

    const alreadyExists =
      state.partners.some(
        partner =>
          partner.assignmentId === assignment.id
      );

    if (alreadyExists) {
      return;
    }

    const hostContact =
      assignment.contactDirectory
        .hostCoordinator;

    const hostPartner: CarePartner = {
      id: this.getNextPartnerId(state),
      assignmentId: assignment.id,
      name: assignment.organizationName,
      city: assignment.city,
      state: assignment.state,
      distanceMiles: 0,
      contactName:
        hostContact.name ||
        'Host follow-up coordinator',
      contactRole:
        hostContact.role ||
        'Care coordinator',
      contactEmail: hostContact.email,
      contactPhone: hostContact.phone,
      relationship: 'host-church',
      serviceArea:
        `${assignment.city} and surrounding communities`,
      ministries: [
        'New believer follow-up',
        'Prayer care'
      ],
      languages: ['English'],
      availability: 'available',
      responseSlaHours: 48,
      notes: 'Host church for this assignment.',
      isActive: true
    };

    this.publish({
      ...state,
      partners: [
        ...state.partners,
        hostPartner
      ]
    });
  }

  getReferralForResponse(
    responseId: number,
    state = this.stateSubject.value
  ): CareReferral | undefined {
    return state.referrals.find(
      referral =>
        referral.responseId === responseId &&
        !['declined', 'expired', 'cancelled'].includes(
          referral.status
        )
    );
  }

  addMinistryResponse(
    input: CreateMinistryResponseInput
  ): MinistryResponse {
    const state = this.stateSubject.value;
    const receivedUtc = new Date().toISOString();
    const ids = state.responses.map(
      response => response.id
    );
    const response: MinistryResponse = {
      ...input,
      id: ids.length
        ? Math.max(...ids) + 1
        : 4101,
      consentSource: input.consentToShare
        ? 'qr-form'
        : 'not-recorded',
      consentRecordedUtc: input.consentToShare
        ? receivedUtc
        : null,
      consentRecordedBy: input.consentToShare
        ? input.personName
        : '',
      receivedUtc,
      status: input.consentToShare
        ? 'ready-to-refer'
        : 'needs-review',
      assignedCoordinator: 'Michael Davis',
      priority: 'standard',
      nextFollowUpUtc:
        this.addHours(receivedUtc, 24),
      lastContactUtc: null,
      contactAttempts: [],
      closedUtc: null,
      closureNote: ''
    };

    this.publish({
      ...state,
      responses: [response, ...state.responses]
    });

    this.assignmentService.addCareReferralActivity(
      input.assignmentId,
      {
        type: 'note-added',
        tone: 'attention',
        title: 'New ministry response received',
        description:
          `${response.personName} submitted a ${response.responseType.toLowerCase()} request through the event response form.`,
        actor: response.personName,
        section: 'responses'
      }
    );

    return response;
  }

  sendReferral(
    responseId: number,
    partnerId: number,
    personalMessage: string
  ): CareReferral | undefined {
    const state = this.stateSubject.value;

    const response = state.responses.find(
      item => item.id === responseId
    );

    const partner = state.partners.find(
      item => item.id === partnerId
    );

    if (
      !response ||
      !partner ||
      !response.consentToShare ||
      (
        partner.assignmentId !== null &&
        response.assignmentId !== partner.assignmentId
      )
    ) {
      return undefined;
    }

    const existingReferral =
      this.getReferralForResponse(
        responseId,
        state
      );

    if (existingReferral) {
      return existingReferral;
    }

    const sentUtc = new Date().toISOString();

    const previousReferral = [...state.referrals]
      .reverse()
      .find(item =>
        item.responseId === responseId &&
        ['declined', 'expired', 'cancelled'].includes(
          item.status
        )
      );

    const referral: CareReferral = {
      id: this.getNextReferralId(state),
      assignmentId: response.assignmentId,
      responseId,
      partnerId,
      status: 'sent',
      personalMessage:
        personalMessage.trim(),
      sentUtc,
      viewedUtc: null,
      respondedUtc: null,
      connectedUtc: null,
      expiresUtc: this.addHours(
        sentUtc,
        partner.responseSlaHours
      ),
      lastReminderUtc: null,
      reminderCount: 0,
      reassignedFromReferralId:
        previousReferral?.id ?? null,
      assignedOwner: '',
      nextStep: '',
      declineReason: '',
      connectionConfirmedBy: '',
      connectionNote: ''
    };

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
            ...item,
            status: 'referred',
            nextFollowUpUtc: referral.expiresUtc,
            closedUtc: null,
            closureNote: ''
          }
          : item
      ),
      referrals: [
        ...state.referrals,
        referral
      ]
    });

    this.assignmentService
      .addCareReferralActivity(
        response.assignmentId,
        {
          type: 'referral-sent',
          tone: 'neutral',
          title: 'Care referral sent',
          description:
            `${response.personName} was referred to ${partner.name}. The church has been asked to accept responsibility within ${partner.responseSlaHours} hours.`,
          actor: 'Michael Davis',
          section: 'follow-up'
        }
      );

    return referral;
  }

  markViewed(
    referralId: number
  ): void {
    const state = this.stateSubject.value;
    const context =
      this.getContextFromState(
        referralId,
        state
      );

    if (
      !context ||
      context.referral.status !== 'sent'
    ) {
      return;
    }

    const viewedUtc = new Date().toISOString();

    this.publish({
      ...state,
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
            ...referral,
            status: 'viewed',
            viewedUtc
          }
          : referral
      )
    });

    this.assignmentService
      .addCareReferralActivity(
        context.referral.assignmentId,
        {
          type: 'referral-viewed',
          tone: 'neutral',
          title: 'Referral opened by partner',
          description:
            `${context.partner.name} opened the secure referral for ${context.response.personName}.`,
          actor: context.partner.name,
          section: 'follow-up'
        }
      );
  }

  acceptReferral(
    referralId: number,
    assignedOwner: string,
    nextStep: string
  ): void {
    const state = this.stateSubject.value;
    const context =
      this.getContextFromState(
        referralId,
        state
      );

    if (
      !context ||
      ![
        'sent',
        'viewed'
      ].includes(context.referral.status)
    ) {
      return;
    }

    const respondedUtc =
      new Date().toISOString();

    const owner = assignedOwner.trim();
    const step = nextStep.trim();

    this.publish({
      ...state,
      responses: state.responses.map(response =>
        response.id === context.response.id
          ? {
            ...response,
            nextFollowUpUtc:
              this.addHours(respondedUtc, 48)
          }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
            ...referral,
            status: 'accepted',
            viewedUtc:
              referral.viewedUtc ??
              respondedUtc,
            respondedUtc,
            assignedOwner: owner,
            nextStep: step,
            declineReason: ''
          }
          : referral
      )
    });

    this.assignmentService
      .addCareReferralActivity(
        context.referral.assignmentId,
        {
          type: 'referral-accepted',
          tone: 'success',
          title: 'Care responsibility accepted',
          description:
            `${context.partner.name} accepted ${context.response.personName}'s referral. ${owner} owns the next step: ${step}.`,
          actor: context.partner.name,
          section: 'follow-up'
        }
      );
  }

  declineReferral(
    referralId: number,
    reason: string
  ): void {
    const state = this.stateSubject.value;
    const context =
      this.getContextFromState(
        referralId,
        state
      );

    if (
      !context ||
      ![
        'sent',
        'viewed'
      ].includes(context.referral.status)
    ) {
      return;
    }

    const respondedUtc =
      new Date().toISOString();

    this.publish({
      ...state,
      responses: state.responses.map(response =>
        response.id ===
          context.response.id
          ? {
            ...response,
            status: 'ready-to-refer',
            nextFollowUpUtc: respondedUtc,
            closureNote: ''
          }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
            ...referral,
            status: 'declined',
            viewedUtc:
              referral.viewedUtc ??
              respondedUtc,
            respondedUtc,
            declineReason: reason.trim()
          }
          : referral
      )
    });

    this.assignmentService
      .addCareReferralActivity(
        context.referral.assignmentId,
        {
          type: 'referral-declined',
          tone: 'attention',
          title: 'Partner unable to accept referral',
          description:
            `${context.partner.name} could not accept ${context.response.personName}'s referral. It has returned to the CTG follow-up queue.`,
          actor: context.partner.name,
          section: 'follow-up'
        }
      );
  }

  expireReferral(
    referralId: number
  ): void {
    const state = this.stateSubject.value;
    const context = this.getContextFromState(
      referralId,
      state
    );

    if (
      !context ||
      !['sent', 'viewed'].includes(
        context.referral.status
      )
    ) {
      return;
    }

    const respondedUtc = new Date().toISOString();

    this.publish({
      ...state,
      responses: state.responses.map(response =>
        response.id === context.response.id
          ? {
              ...response,
              status: 'ready-to-refer',
              nextFollowUpUtc: respondedUtc,
              closureNote: ''
            }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
              ...referral,
              status: 'expired',
              respondedUtc,
              declineReason:
                'No response within the requested service window.'
            }
          : referral
      )
    });

    this.assignmentService.addCareReferralActivity(
      context.referral.assignmentId,
      {
        type: 'referral-declined',
        tone: 'attention',
        title: 'Referral expired and reassignment needed',
        description:
          `${context.partner.name} did not respond in time. ${context.response.personName} returned to the care queue for reassignment.`,
        actor: 'Michael Davis',
        section: 'follow-up'
      }
    );
  }

  markResponseUnreachable(
    responseId: number
  ): void {
    this.updateResponseException(
      responseId,
      'unreachable',
      'Person marked unreachable'
    );
  }

  withdrawConsent(
    responseId: number
  ): void {
    this.updateResponseException(
      responseId,
      'withdrawn',
      'Consent withdrawn'
    );
  }

  verifyConsent(
    responseId: number,
    source: Extract<
      MinistryResponseConsentSource,
      'verbal-confirmation' | 'written-confirmation'
    >,
    actor = 'Michael Davis'
  ): void {
    const state = this.stateSubject.value;
    const response = state.responses.find(
      item => item.id === responseId
    );

    if (!response || response.status === 'connected') {
      return;
    }

    const consentRecordedUtc =
      new Date().toISOString();

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
              ...item,
              consentToShare: true,
              consentSource: source,
              consentRecordedUtc,
              consentRecordedBy: actor,
              status: 'ready-to-refer',
              nextFollowUpUtc: consentRecordedUtc,
              closedUtc: null,
              closureNote: ''
            }
          : item
      )
    });

    this.assignmentService.addCareReferralActivity(
      response.assignmentId,
      {
        type: 'note-added',
        tone: 'success',
        title: 'Consent verified',
        description:
          `${actor} confirmed ${response.personName}'s permission to share through ${source.replace('-', ' ')}.`,
        actor,
        section: 'responses'
      }
    );
  }

  confirmConnected(
    referralId: number,
    actor = 'Michael Davis',
    connectionNote = 'Local connection confirmed.'
  ): void {
    const state = this.stateSubject.value;
    const context =
      this.getContextFromState(
        referralId,
        state
      );

    if (
      !context ||
      context.referral.status !== 'accepted'
    ) {
      return;
    }

    const connectedUtc =
      new Date().toISOString();

    this.publish({
      ...state,
      responses: state.responses.map(response =>
        response.id ===
          context.response.id
          ? {
            ...response,
            status: 'connected',
            nextFollowUpUtc: null,
            closedUtc: connectedUtc,
            closureNote: connectionNote.trim()
          }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
            ...referral,
            status: 'connected',
            connectedUtc,
            connectionConfirmedBy: actor,
            connectionNote: connectionNote.trim()
          }
          : referral
      )
    });

    this.assignmentService
      .addCareReferralActivity(
        context.referral.assignmentId,
        {
          type: 'person-connected',
          tone: 'success',
          title: 'Local connection confirmed',
          description:
            `${context.response.personName} was connected with ${context.partner.name}. CTG's accountable handoff is complete.`,
          actor,
          section: 'follow-up'
        }
      );
  }

  addCarePartner(
    input: CreateCarePartnerInput
  ): CarePartner {
    const state = this.stateSubject.value;

    const partner: CarePartner = {
      ...input,
      id: this.getNextPartnerId(state),
      name: input.name.trim(),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone.trim(),
      ministries: input.ministries
        .map(item => item.trim())
        .filter(Boolean),
      languages: input.languages
        .map(item => item.trim())
        .filter(Boolean),
      notes: input.notes.trim(),
      isActive: true
    };

    this.publish({
      ...state,
      partners: [...state.partners, partner]
    });

    if (input.assignmentId !== null) {
      this.assignmentService.addCareReferralActivity(
        input.assignmentId,
        {
          type: 'note-added',
          tone: 'neutral',
          title: 'Local care partner added',
          description:
            `${partner.name} was added to the trusted partner list for this assignment.`,
          actor: 'Michael Davis',
          section: 'follow-up'
        }
      );
    }

    return partner;
  }

  setPartnerAvailability(
    partnerId: number,
    availability: CarePartner['availability']
  ): void {
    const state = this.stateSubject.value;
    const partner = state.partners.find(
      item => item.id === partnerId
    );

    if (!partner) {
      return;
    }

    this.publish({
      ...state,
      partners: state.partners.map(item =>
        item.id === partnerId
          ? { ...item, availability }
          : item
      )
    });
  }

  updateCasePlan(
    responseId: number,
    assignedCoordinator: string,
    priority: CareCasePriority,
    nextFollowUpUtc: string | null
  ): void {
    const state = this.stateSubject.value;
    const response = state.responses.find(
      item => item.id === responseId
    );

    if (!response || response.status === 'connected') {
      return;
    }

    const owner = assignedCoordinator.trim();
    const dueUtc = nextFollowUpUtc
      ? new Date(nextFollowUpUtc).toISOString()
      : null;

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
              ...item,
              assignedCoordinator: owner,
              priority,
              nextFollowUpUtc: dueUtc
            }
          : item
      )
    });

    this.assignmentService.addCareReferralActivity(
      response.assignmentId,
      {
        type: 'note-added',
        tone: priority === 'urgent'
          ? 'attention'
          : 'neutral',
        title: 'Care plan updated',
        description:
          `${owner || 'The care team'} owns ${response.personName}'s follow-up${dueUtc ? ` due ${new Date(dueUtc).toLocaleString()}` : ''}.`,
        actor: 'Michael Davis',
        section: 'follow-up'
      }
    );
  }

  recordContactAttempt(
    responseId: number,
    method: CareContactMethod,
    outcome: CareContactOutcome,
    note: string,
    actor = 'Michael Davis'
  ): CareContactAttempt | undefined {
    const state = this.stateSubject.value;
    const response = state.responses.find(
      item => item.id === responseId
    );

    if (
      !response ||
      ['connected', 'withdrawn'].includes(response.status)
    ) {
      return undefined;
    }

    const createdUtc = new Date().toISOString();
    const attempt: CareContactAttempt = {
      id: this.getNextContactAttemptId(state),
      responseId,
      method,
      outcome,
      note: note.trim(),
      createdUtc,
      createdBy: actor
    };

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
              ...item,
              lastContactUtc: createdUtc,
              contactAttempts: [
                attempt,
                ...item.contactAttempts
              ],
              nextFollowUpUtc:
                outcome === 'reached'
                  ? item.nextFollowUpUtc
                  : this.addHours(createdUtc, 24)
            }
          : item
      )
    });

    this.assignmentService.addCareReferralActivity(
      response.assignmentId,
      {
        type: 'note-added',
        tone: outcome === 'reached'
          ? 'success'
          : 'neutral',
        title: 'Care contact attempt recorded',
        description:
          `${actor} contacted ${response.personName} by ${method}; outcome: ${outcome.replace('-', ' ')}${attempt.note ? `. ${attempt.note}` : ''}`,
        actor,
        section: 'follow-up'
      }
    );

    return attempt;
  }

  sendReferralReminder(
    referralId: number
  ): void {
    const state = this.stateSubject.value;
    const context = this.getContextFromState(
      referralId,
      state
    );

    if (
      !context ||
      !['sent', 'viewed'].includes(
        context.referral.status
      )
    ) {
      return;
    }

    const lastReminderUtc =
      new Date().toISOString();

    this.publish({
      ...state,
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
              ...referral,
              lastReminderUtc,
              reminderCount:
                referral.reminderCount + 1
            }
          : referral
      )
    });

    this.assignmentService.addCareReferralActivity(
      context.referral.assignmentId,
      {
        type: 'note-added',
        tone: 'attention',
        title: 'Care referral reminder sent',
        description:
          `${context.partner.name} was reminded to respond to ${context.response.personName}'s referral.`,
        actor: 'Michael Davis',
        section: 'follow-up'
      }
    );
  }

  returnReferralToQueue(
    referralId: number,
    reason: string,
    actor = 'Michael Davis'
  ): void {
    const state = this.stateSubject.value;
    const context = this.getContextFromState(
      referralId,
      state
    );

    if (
      !context ||
      !['sent', 'viewed', 'accepted'].includes(
        context.referral.status
      )
    ) {
      return;
    }

    const returnedUtc = new Date().toISOString();
    const returnReason = reason.trim() ||
      'Referral returned for reassignment.';

    this.publish({
      ...state,
      responses: state.responses.map(response =>
        response.id === context.response.id
          ? {
              ...response,
              status: 'ready-to-refer',
              nextFollowUpUtc: returnedUtc,
              closureNote: ''
            }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
              ...referral,
              status: 'cancelled',
              respondedUtc: returnedUtc,
              declineReason: returnReason
            }
          : referral
      )
    });

    this.assignmentService.addCareReferralActivity(
      context.referral.assignmentId,
      {
        type: 'referral-declined',
        tone: 'attention',
        title: 'Referral returned for reassignment',
        description:
          `${context.response.personName}'s referral was returned from ${context.partner.name}. Reason: ${returnReason}`,
        actor,
        section: 'follow-up'
      }
    );
  }

  resetDemo(): void {
    this.assignmentService
      .resetCareReferralActivity(2001);

    this.publish(
      this.createSeedState()
    );
  }

  private getContextFromState(
    referralId: number,
    state: CareNetworkState
  ): CareReferralContext | undefined {
    const referral = state.referrals.find(
      item => item.id === referralId
    );

    if (!referral) {
      return undefined;
    }

    const response = state.responses.find(
      item => item.id === referral.responseId
    );

    const partner = state.partners.find(
      item => item.id === referral.partnerId
    );

    if (!response || !partner) {
      return undefined;
    }

    return {
      referral,
      response,
      partner
    };
  }

  private updateResponseException(
    responseId: number,
    status: 'unreachable' | 'withdrawn',
    title: string
  ): void {
    const state = this.stateSubject.value;
    const response = state.responses.find(
      item => item.id === responseId
    );

    if (!response || response.status === 'connected') {
      return;
    }

    const closedUtc = new Date().toISOString();
    const closureNote = status === 'withdrawn'
      ? 'The person withdrew permission to share their care request.'
      : 'The ministry team could not reach the person after follow-up attempts.';

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
              ...item,
              status,
              consentToShare:
                status === 'withdrawn'
                  ? false
                  : item.consentToShare,
              consentSource:
                status === 'withdrawn'
                  ? 'not-recorded'
                  : item.consentSource,
              consentRecordedUtc:
                status === 'withdrawn'
                  ? null
                  : item.consentRecordedUtc,
              consentRecordedBy:
                status === 'withdrawn'
                  ? ''
                  : item.consentRecordedBy,
              nextFollowUpUtc: null,
              closedUtc,
              closureNote
            }
          : item
      ),
      referrals: state.referrals.map(referral =>
        referral.responseId === responseId &&
        ![
          'declined',
          'expired',
          'cancelled',
          'connected'
        ].includes(referral.status)
          ? {
              ...referral,
              status: 'cancelled' as const,
              respondedUtc: closedUtc,
              declineReason: closureNote
            }
          : referral
      )
    });

    this.assignmentService.addCareReferralActivity(
      response.assignmentId,
      {
        type: 'note-added',
        tone: 'attention',
        title,
        description:
          `${response.personName}'s care record was updated to ${status}.`,
        actor: 'Michael Davis',
        section: 'follow-up'
      }
    );
  }

  private getNextPartnerId(
    state: CareNetworkState
  ): number {
    return state.partners.length === 0
      ? 1
      : Math.max(
        ...state.partners.map(
          partner => partner.id
        )
      ) + 1;
  }

  private getNextReferralId(
    state: CareNetworkState
  ): number {
    return state.referrals.length === 0
      ? 5001
      : Math.max(
        ...state.referrals.map(
          referral => referral.id
        )
      ) + 1;
  }

  private getNextContactAttemptId(
    state: CareNetworkState
  ): number {
    const ids = state.responses.flatMap(
      response => response.contactAttempts.map(
        attempt => attempt.id
      )
    );

    return ids.length === 0
      ? 7001
      : Math.max(...ids) + 1;
  }

  private addHours(
    dateTime: string,
    hours: number
  ): string {
    const date = new Date(dateTime);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }

  private publish(
    state: CareNetworkState
  ): void {
    this.stateSubject.next(state);

    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify(state)
      );
    } catch {
      // Demo state remains available in memory when storage is blocked.
    }
  }

  private loadState(): CareNetworkState {
    try {
      const storedState =
        window.localStorage.getItem(
          this.storageKey
        );

      if (storedState) {
        const parsed = JSON.parse(
          storedState
        ) as CareNetworkState;

        return {
          ...parsed,
          partners: (parsed.partners ?? []).map(partner => ({
            ...partner,
            assignmentId:
              partner.relationship === 'verified-partner'
                ? null
                : partner.assignmentId,
            contactPhone: partner.contactPhone ?? '',
            notes: partner.notes ?? '',
            isActive: partner.isActive ?? true
          })),
          responses: (parsed.responses ?? []).map(response => ({
            ...response,
            consentSource:
              response.consentSource ??
              (response.consentToShare
                ? 'qr-form'
                : 'not-recorded'),
            consentRecordedUtc:
              response.consentRecordedUtc ??
              (response.consentToShare
                ? response.receivedUtc
                : null),
            consentRecordedBy:
              response.consentRecordedBy ??
              (response.consentToShare
                ? response.personName
                : ''),
            assignedCoordinator:
              response.assignedCoordinator ??
              'Michael Davis',
            priority:
              response.priority ?? 'standard',
            nextFollowUpUtc:
              response.nextFollowUpUtc ?? null,
            lastContactUtc:
              response.lastContactUtc ?? null,
            contactAttempts:
              response.contactAttempts ?? [],
            closedUtc:
              response.closedUtc ?? null,
            closureNote:
              response.closureNote ?? ''
          })),
          referrals: (parsed.referrals ?? []).map(referral => ({
            ...referral,
            expiresUtc:
              referral.expiresUtc ??
              (referral.sentUtc
                ? this.addHours(referral.sentUtc, 48)
                : null),
            lastReminderUtc:
              referral.lastReminderUtc ?? null,
            reminderCount:
              referral.reminderCount ?? 0,
            reassignedFromReferralId:
              referral.reassignedFromReferralId ?? null,
            connectionConfirmedBy:
              referral.connectionConfirmedBy ?? '',
            connectionNote:
              referral.connectionNote ?? ''
          }))
        };
      }
    } catch {
      // Fall back to deterministic demo data.
    }

    return this.createSeedState();
  }

  private createSeedState(): CareNetworkState {
    return {
      partners: [
        {
          id: 301,
          assignmentId: 2001,
          name: 'New Covenant Global Church',
          city: 'Atlanta',
          state: 'GA',
          distanceMiles: 0,
          contactName: 'Pastor Simone Reed',
          contactRole: 'Discipleship pastor',
          contactEmail:
            'simone@newcovenant.example',
          contactPhone: '(404) 555-0110',
          relationship: 'host-church',
          serviceArea:
            'Central Atlanta and nearby communities',
          ministries: [
            'New believer pathway',
            'Young adults',
            'Prayer care'
          ],
          languages: [
            'English',
            'Spanish'
          ],
          availability: 'available',
          responseSlaHours: 24,
          notes:
            'Host church with an established new-believer pathway.',
          isActive: true
        },
        {
          id: 302,
          assignmentId: null,
          name: 'Greater Atlanta Community Church',
          city: 'Decatur',
          state: 'GA',
          distanceMiles: 5,
          contactName: 'Jordan Ellis',
          contactRole: 'Connections director',
          contactEmail:
            'jordan@greateratlanta.example',
          contactPhone: '(404) 555-0148',
          relationship: 'verified-partner',
          serviceArea:
            'Decatur, East Atlanta and Avondale Estates',
          ministries: [
            'Foundations small groups',
            'Young professionals',
            'Family support'
          ],
          languages: ['English'],
          availability: 'available',
          responseSlaHours: 48,
          notes:
            'Strong fit for young adults and foundations groups.',
          isActive: true
        },
        {
          id: 303,
          assignmentId: null,
          name: 'Eastside Fellowship',
          city: 'Stone Mountain',
          state: 'GA',
          distanceMiles: 13,
          contactName: 'Minister Leah Grant',
          contactRole: 'Care team lead',
          contactEmail:
            'leah@eastsidefellowship.example',
          contactPhone: '(770) 555-0162',
          relationship: 'verified-partner',
          serviceArea:
            'Stone Mountain and eastern DeKalb County',
          ministries: [
            'Prayer follow-up',
            'Women\'s care groups'
          ],
          languages: ['English'],
          availability: 'limited',
          responseSlaHours: 72,
          notes:
            'Confirm capacity before sending more than one referral.',
          isActive: true
        }
      ],
      responses: [
        {
          id: 4101,
          assignmentId: 2001,
          personName: 'Jasmine Lee',
          email: 'jasmine.lee@example.com',
          phone: '(404) 555-0186',
          preferredContactMethod: 'text',
          city: 'Decatur',
          state: 'GA',
          postalCode: '30030',
          responseType: 'Discipleship',
          requestedSupport:
            'Wants to join a local foundations group and connect with a church community.',
          consentToShare: true,
          consentSource: 'qr-form',
          consentRecordedUtc:
            '2026-08-30T20:42:00.000Z',
          consentRecordedBy: 'Jasmine Lee',
          receivedUtc:
            '2026-08-30T20:42:00.000Z',
          status: 'ready-to-refer',
          assignedCoordinator: 'Michael Davis',
          priority: 'standard',
          nextFollowUpUtc:
            '2026-08-31T15:00:00.000Z',
          lastContactUtc: null,
          contactAttempts: [],
          closedUtc: null,
          closureNote: ''
        },
        {
          id: 4102,
          assignmentId: 2001,
          personName: 'Daniel Carter',
          email: 'daniel.carter@example.com',
          phone: '(678) 555-0142',
          preferredContactMethod: 'phone',
          city: 'Marietta',
          state: 'GA',
          postalCode: '30060',
          responseType: 'Prayer follow-up',
          requestedSupport:
            'Requested a follow-up conversation before selecting a local church.',
          consentToShare: false,
          consentSource: 'not-recorded',
          consentRecordedUtc: null,
          consentRecordedBy: '',
          receivedUtc:
            '2026-08-30T20:49:00.000Z',
          status: 'needs-review',
          assignedCoordinator: 'Michael Davis',
          priority: 'urgent',
          nextFollowUpUtc:
            '2026-08-31T13:30:00.000Z',
          lastContactUtc: null,
          contactAttempts: [],
          closedUtc: null,
          closureNote: ''
        },
        {
          id: 4103,
          assignmentId: 2001,
          personName: 'Aisha Morgan',
          email: 'aisha.morgan@example.com',
          phone: '(470) 555-0117',
          preferredContactMethod: 'email',
          city: 'Atlanta',
          state: 'GA',
          postalCode: '30308',
          responseType: 'Church connection',
          requestedSupport:
            'Asked to connect with a nearby church and a young-adult discipleship group.',
          consentToShare: true,
          consentSource: 'qr-form',
          consentRecordedUtc:
            '2026-08-30T21:03:00.000Z',
          consentRecordedBy: 'Aisha Morgan',
          receivedUtc:
            '2026-08-30T21:03:00.000Z',
          status: 'referred',
          assignedCoordinator: 'Michael Davis',
          priority: 'standard',
          nextFollowUpUtc:
            '2026-09-01T13:15:00.000Z',
          lastContactUtc:
            '2026-08-31T12:30:00.000Z',
          contactAttempts: [
            {
              id: 7001,
              responseId: 4103,
              method: 'email',
              outcome: 'reached',
              note:
                'Confirmed she still wants a local church connection.',
              createdUtc:
                '2026-08-31T12:30:00.000Z',
              createdBy: 'Michael Davis'
            }
          ],
          closedUtc: null,
          closureNote: ''
        }
      ],
      referrals: [
        {
          id: 5001,
          assignmentId: 2001,
          responseId: 4103,
          partnerId: 301,
          status: 'sent',
          personalMessage:
            'Aisha asked for a local church connection and young-adult discipleship. Please let our team know whether you can receive this referral.',
          sentUtc:
            '2026-08-31T13:15:00.000Z',
          viewedUtc: null,
          respondedUtc: null,
          connectedUtc: null,
          expiresUtc:
            '2026-09-01T13:15:00.000Z',
          lastReminderUtc: null,
          reminderCount: 0,
          reassignedFromReferralId: null,
          assignedOwner: '',
          nextStep: '',
          declineReason: '',
          connectionConfirmedBy: '',
          connectionNote: ''
        }
      ]
    };
  }
}
