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
  CareNetworkState,
  CarePartner,
  CareReferral,
  CareReferralContext,
  CreateMinistryResponseInput,
  MinistryResponse
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
            partner.assignmentId === assignmentId
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
      relationship: 'host-church',
      serviceArea:
        `${assignment.city} and surrounding communities`,
      ministries: [
        'New believer follow-up',
        'Prayer care'
      ],
      languages: ['English'],
      availability: 'available',
      responseSlaHours: 48
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
        !['declined', 'expired'].includes(
          referral.status
        )
    );
  }

  addMinistryResponse(
    input: CreateMinistryResponseInput
  ): MinistryResponse {
    const state = this.stateSubject.value;
    const ids = state.responses.map(
      response => response.id
    );
    const response: MinistryResponse = {
      ...input,
      id: ids.length
        ? Math.max(...ids) + 1
        : 4101,
      receivedUtc: new Date().toISOString(),
      status: input.consentToShare
        ? 'ready-to-refer'
        : 'needs-review'
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
      response.assignmentId !==
        partner.assignmentId
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
      assignedOwner: '',
      nextStep: '',
      declineReason: ''
    };

    this.publish({
      ...state,
      responses: state.responses.map(item =>
        item.id === responseId
          ? {
            ...item,
            status: 'referred'
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
            status: 'ready-to-refer'
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
          ? { ...response, status: 'ready-to-refer' }
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

  confirmConnected(
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
            status: 'connected'
          }
          : response
      ),
      referrals: state.referrals.map(referral =>
        referral.id === referralId
          ? {
            ...referral,
            status: 'connected',
            connectedUtc
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
          actor: 'Michael Davis',
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

    if (!response) {
      return;
    }

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
                  : item.consentToShare
            }
          : item
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
        return JSON.parse(
          storedState
        ) as CareNetworkState;
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
          responseSlaHours: 24
        },
        {
          id: 302,
          assignmentId: 2001,
          name: 'Greater Atlanta Community Church',
          city: 'Decatur',
          state: 'GA',
          distanceMiles: 5,
          contactName: 'Jordan Ellis',
          contactRole: 'Connections director',
          contactEmail:
            'jordan@greateratlanta.example',
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
          responseSlaHours: 48
        },
        {
          id: 303,
          assignmentId: 2001,
          name: 'Eastside Fellowship',
          city: 'Stone Mountain',
          state: 'GA',
          distanceMiles: 13,
          contactName: 'Minister Leah Grant',
          contactRole: 'Care team lead',
          contactEmail:
            'leah@eastsidefellowship.example',
          relationship: 'verified-partner',
          serviceArea:
            'Stone Mountain and eastern DeKalb County',
          ministries: [
            'Prayer follow-up',
            'Women\'s care groups'
          ],
          languages: ['English'],
          availability: 'limited',
          responseSlaHours: 72
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
          receivedUtc:
            '2026-08-30T20:42:00.000Z',
          status: 'ready-to-refer'
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
          receivedUtc:
            '2026-08-30T20:49:00.000Z',
          status: 'needs-review'
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
          receivedUtc:
            '2026-08-30T21:03:00.000Z',
          status: 'referred'
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
          assignedOwner: '',
          nextStep: '',
          declineReason: ''
        }
      ]
    };
  }
}
