import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  Observable,
  combineLatest,
  map
} from 'rxjs';

import {
  Assignment
} from '../../../shared/models/assignment.model';

import {
  CareCasePriority,
  CareContactMethod,
  CareContactOutcome,
  CareNetworkState,
  CarePartner,
  CareReferral,
  CareReferralStatus,
  MinistryResponse,
  MinistryResponseConsentSource,
  MinistryResponseStatus
} from '../../../shared/models/care-referral.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

import {
  CareReferralService
} from '../../../shared/services/care-referral.service';

interface CareNetworkViewModel {
  assignment: Assignment;
  network: CareNetworkState;
}

type ConsentAction =
  | 'verify'
  | 'withdraw';

type CareQueueFilter =
  | 'all'
  | 'action'
  | 'awaiting'
  | 'accepted'
  | 'closed';

@Component({
  standalone: false,
  selector: 'app-assignment-care-network',
  templateUrl:
    './assignment-care-network.component.html',
  styleUrls: [
    './assignment-care-network.component.scss'
  ]
})
export class AssignmentCareNetworkComponent {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  selectedResponseId = 4101;
  selectedPartnerId = 302;

  personalMessage =
    'Jasmine asked to join a local foundations group and gave permission for CTG to share her contact details. Please confirm whether your team can receive this referral.';

  emailPreviewVisible = false;
  sendError = '';
  queueFilter: CareQueueFilter = 'all';

  caseOwner = 'Michael Davis';
  casePriority: CareCasePriority = 'standard';
  nextFollowUpLocal = '2026-08-31T15:00';
  casePlanNotice = '';

  contactMethod: CareContactMethod = 'text';
  contactOutcome: CareContactOutcome = 'reached';
  contactNote = '';
  contactNotice = '';

  returnReason = '';
  partnerFormVisible = false;
  partnerError = '';
  newPartner = {
    name: '',
    city: '',
    state: '',
    contactName: '',
    contactRole: 'Care coordinator',
    contactEmail: '',
    contactPhone: '',
    serviceArea: '',
    ministries: 'New believer follow-up',
    languages: 'English',
    responseSlaHours: 48,
    notes: ''
  };

  pendingConsentAction:
    { responseId: number; action: ConsentAction } | null = null;

  consentVerificationSource:
    Extract<
      MinistryResponseConsentSource,
      'verbal-confirmation' | 'written-confirmation'
    > = 'verbal-confirmation';

  readonly viewModel$:
    Observable<CareNetworkViewModel | undefined> =
    combineLatest([
      this.assignmentService.getAssignment(
        this.assignmentId
      ),
      this.careReferralService
        .getAssignmentNetwork(
          this.assignmentId
        )
    ]).pipe(
      map(([
        assignment,
        network
      ]) => {
        if (!assignment) {
          return undefined;
        }

        this.careReferralService
          .ensureAssignmentNetwork(assignment);

        return {
          assignment,
          network
        };
      })
    );

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly assignmentService:
      AssignmentService,

    private readonly careReferralService:
      CareReferralService
  ) {}

  selectResponse(
    response: MinistryResponse,
    network: CareNetworkState
  ): void {
    this.selectedResponseId = response.id;
    this.sendError = '';
    this.pendingConsentAction = null;
    this.caseOwner = response.assignedCoordinator;
    this.casePriority = response.priority;
    this.nextFollowUpLocal = this.toLocalInputValue(
      response.nextFollowUpUtc
    );
    this.casePlanNotice = '';
    this.contactMethod =
      response.preferredContactMethod;
    this.contactOutcome = 'reached';
    this.contactNote = '';
    this.contactNotice = '';
    this.returnReason = '';

    const matchingPartner =
      network.partners.find(partner =>
        partner.city === response.city &&
        partner.availability === 'available'
      ) ?? network.partners.find(
        partner =>
          partner.availability === 'available'
      );

    if (matchingPartner) {
      this.selectedPartnerId =
        matchingPartner.id;
    }

    this.personalMessage =
      response.consentToShare
        ? `${response.personName} requested ${response.responseType.toLowerCase()} support and gave permission for CTG to share contact details. Please confirm whether your team can receive this referral.`
        : `${response.personName} requested ${response.responseType.toLowerCase()} support. Consent has not yet been verified, so this referral must not be sent.`;
  }

  selectPartner(
    partner: CarePartner
  ): void {
    this.selectedPartnerId = partner.id;
    this.sendError = '';
  }

  setQueueFilter(
    filter: CareQueueFilter
  ): void {
    this.queueFilter = filter;
  }

  togglePartnerForm(): void {
    this.partnerFormVisible =
      !this.partnerFormVisible;
    this.partnerError = '';
  }

  updateNewPartnerField(
    field: keyof typeof this.newPartner,
    event: Event
  ): void {
    const target = event.target as HTMLInputElement;

    if (field === 'responseSlaHours') {
      this.newPartner.responseSlaHours =
        Number(target.value);
      return;
    }

    this.newPartner[field] = target.value as never;
  }

  addLocalPartner(): void {
    this.partnerError = '';

    if (
      !this.newPartner.name.trim() ||
      !this.newPartner.city.trim() ||
      !this.newPartner.contactName.trim() ||
      !this.newPartner.contactEmail.trim()
    ) {
      this.partnerError =
        'Church, city, contact name and email are required.';
      return;
    }

    const partner = this.careReferralService.addCarePartner({
      assignmentId: this.assignmentId,
      name: this.newPartner.name,
      city: this.newPartner.city,
      state: this.newPartner.state,
      distanceMiles: 0,
      contactName: this.newPartner.contactName,
      contactRole: this.newPartner.contactRole,
      contactEmail: this.newPartner.contactEmail,
      contactPhone: this.newPartner.contactPhone,
      relationship: 'verified-partner',
      serviceArea:
        this.newPartner.serviceArea ||
        `${this.newPartner.city} and surrounding communities`,
      ministries: this.newPartner.ministries.split(','),
      languages: this.newPartner.languages.split(','),
      availability: 'available',
      responseSlaHours:
        this.newPartner.responseSlaHours || 48,
      notes: this.newPartner.notes
    });

    this.selectedPartnerId = partner.id;
    this.partnerFormVisible = false;
    this.newPartner = {
      name: '',
      city: '',
      state: '',
      contactName: '',
      contactRole: 'Care coordinator',
      contactEmail: '',
      contactPhone: '',
      serviceArea: '',
      ministries: 'New believer follow-up',
      languages: 'English',
      responseSlaHours: 48,
      notes: ''
    };
  }

  updatePersonalMessage(
    event: Event
  ): void {
    this.personalMessage =
      (
        event.target as HTMLTextAreaElement
      ).value;
  }

  sendReferral(
    network: CareNetworkState
  ): void {
    this.sendError = '';

    const response = this.getSelectedResponse(
      network
    );

    if (!response) {
      this.sendError =
        'Select a ministry response before sending.';
      return;
    }

    if (!response.consentToShare) {
      this.sendError =
        'Consent is required before sharing this response with a church.';
      return;
    }

    const referral =
      this.careReferralService.sendReferral(
        response.id,
        this.selectedPartnerId,
        this.personalMessage
      );

    if (!referral) {
      this.sendError =
        'This referral could not be sent. Confirm the response and partner selection.';
      return;
    }

    this.emailPreviewVisible = true;
  }

  openPartnerResponse(
    referral: CareReferral
  ): void {
    this.router.navigate([
      '/app/referrals',
      referral.id,
      'respond'
    ]);
  }

  confirmConnected(
    referral: CareReferral
  ): void {
    this.careReferralService
      .confirmConnected(referral.id);
  }

  sendReminder(
    referral: CareReferral
  ): void {
    this.careReferralService
      .sendReferralReminder(referral.id);
  }

  returnToQueue(
    referral: CareReferral
  ): void {
    this.careReferralService
      .returnReferralToQueue(
        referral.id,
        this.returnReason
      );
    this.returnReason = '';
  }

  expireReferral(
    referral: CareReferral
  ): void {
    this.careReferralService.expireReferral(
      referral.id
    );
  }

  markUnreachable(
    response: MinistryResponse
  ): void {
    this.careReferralService.markResponseUnreachable(
      response.id
    );
  }

  updateCaseOwner(event: Event): void {
    this.caseOwner =
      (event.target as HTMLInputElement).value;
  }

  updateCasePriority(event: Event): void {
    this.casePriority =
      (event.target as HTMLSelectElement).value as
        CareCasePriority;
  }

  updateNextFollowUp(event: Event): void {
    this.nextFollowUpLocal =
      (event.target as HTMLInputElement).value;
  }

  saveCasePlan(
    response: MinistryResponse
  ): void {
    this.careReferralService.updateCasePlan(
      response.id,
      this.caseOwner,
      this.casePriority,
      this.nextFollowUpLocal || null
    );
    this.casePlanNotice = 'Care plan saved.';
  }

  updateContactMethod(event: Event): void {
    this.contactMethod =
      (event.target as HTMLSelectElement).value as
        CareContactMethod;
  }

  updateContactOutcome(event: Event): void {
    this.contactOutcome =
      (event.target as HTMLSelectElement).value as
        CareContactOutcome;
  }

  updateContactNote(event: Event): void {
    this.contactNote =
      (event.target as HTMLTextAreaElement).value;
  }

  recordContactAttempt(
    response: MinistryResponse
  ): void {
    const attempt = this.careReferralService
      .recordContactAttempt(
        response.id,
        this.contactMethod,
        this.contactOutcome,
        this.contactNote
      );

    if (!attempt) {
      return;
    }

    this.contactNote = '';
    this.contactNotice = 'Contact attempt recorded.';
  }

  requestConsentAction(
    response: MinistryResponse,
    action: ConsentAction
  ): void {
    this.pendingConsentAction = {
      responseId: response.id,
      action
    };
  }

  cancelConsentAction(): void {
    this.pendingConsentAction = null;
    this.queueFilter = 'all';
    this.caseOwner = 'Michael Davis';
    this.casePriority = 'standard';
    this.nextFollowUpLocal = '2026-08-31T15:00';
    this.casePlanNotice = '';
    this.contactNote = '';
    this.contactNotice = '';
    this.returnReason = '';
    this.partnerFormVisible = false;
  }

  updateConsentSource(event: Event): void {
    this.consentVerificationSource =
      (event.target as HTMLSelectElement).value as
        typeof this.consentVerificationSource;
  }

  confirmConsentAction(
    response: MinistryResponse
  ): void {
    const pending = this.pendingConsentAction;

    if (!pending || pending.responseId !== response.id) {
      return;
    }

    if (pending.action === 'verify') {
      this.careReferralService.verifyConsent(
        response.id,
        this.consentVerificationSource
      );

      this.personalMessage =
        `${response.personName} requested ${response.responseType.toLowerCase()} support and directly confirmed permission for CTG to share contact details. Please confirm whether your team can receive this referral.`;
    } else {
      this.careReferralService.withdrawConsent(
        response.id
      );
    }

    this.pendingConsentAction = null;
    this.sendError = '';
  }

  isConsentActionPending(
    response: MinistryResponse,
    action?: ConsentAction
  ): boolean {
    return Boolean(
      this.pendingConsentAction?.responseId === response.id &&
      (
        !action ||
        this.pendingConsentAction.action === action
      )
    );
  }

  getConsentSourceLabel(
    source: MinistryResponseConsentSource
  ): string {
    switch (source) {
      case 'qr-form':
        return 'QR response form';

      case 'verbal-confirmation':
        return 'Direct verbal confirmation';

      case 'written-confirmation':
        return 'Written confirmation';

      case 'not-recorded':
      default:
        return 'Not recorded';
    }
  }

  resetDemo(): void {
    this.careReferralService.resetDemo();
    this.selectedResponseId = 4101;
    this.selectedPartnerId = 302;
    this.emailPreviewVisible = false;
    this.sendError = '';
    this.pendingConsentAction = null;
  }

  getSelectedResponse(
    network: CareNetworkState
  ): MinistryResponse | undefined {
    return network.responses.find(
      response =>
        response.id === this.selectedResponseId
    );
  }

  getSelectedPartner(
    network: CareNetworkState
  ): CarePartner | undefined {
    return network.partners.find(
      partner =>
        partner.id === this.selectedPartnerId
    );
  }

  getReferralForResponse(
    response: MinistryResponse,
    network: CareNetworkState
  ): CareReferral | undefined {
    return network.referrals.find(
      referral =>
        referral.responseId === response.id &&
        !['declined', 'expired', 'cancelled'].includes(
          referral.status
        )
    );
  }

  getReferralPartner(
    referral: CareReferral,
    network: CareNetworkState
  ): CarePartner | undefined {
    return network.partners.find(
      partner =>
        partner.id === referral.partnerId
    );
  }

  countByReferralStatus(
    network: CareNetworkState,
    statuses: CareReferralStatus[]
  ): number {
    return network.referrals.filter(
      referral =>
        statuses.includes(referral.status)
    ).length;
  }

  countReadyResponses(
    network: CareNetworkState
  ): number {
    return network.responses.filter(
      response =>
        response.status === 'ready-to-refer'
    ).length;
  }

  countNeedsAction(
    network: CareNetworkState
  ): number {
    return network.responses.filter(response =>
      ['needs-review', 'ready-to-refer'].includes(
        response.status
      ) || this.isFollowUpDue(response)
    ).length;
  }

  getFilteredResponses(
    network: CareNetworkState
  ): MinistryResponse[] {
    return network.responses.filter(response => {
      const referral = this.getReferralForResponse(
        response,
        network
      );

      switch (this.queueFilter) {
        case 'action':
          return [
            'needs-review',
            'ready-to-refer'
          ].includes(response.status) ||
            this.isFollowUpDue(response);

        case 'awaiting':
          return Boolean(
            referral &&
            ['sent', 'viewed'].includes(
              referral.status
            )
          );

        case 'accepted':
          return referral?.status === 'accepted';

        case 'closed':
          return [
            'connected',
            'unreachable',
            'withdrawn'
          ].includes(response.status);

        case 'all':
        default:
          return true;
      }
    });
  }

  getReferralHistory(
    response: MinistryResponse,
    network: CareNetworkState
  ): CareReferral[] {
    return network.referrals
      .filter(referral =>
        referral.responseId === response.id
      )
      .sort((a, b) =>
        (b.sentUtc ?? '').localeCompare(
          a.sentUtc ?? ''
        )
      );
  }

  isFollowUpDue(
    response: MinistryResponse
  ): boolean {
    if (
      !response.nextFollowUpUtc ||
      [
        'connected',
        'unreachable',
        'withdrawn'
      ].includes(response.status)
    ) {
      return false;
    }

    return new Date(
      response.nextFollowUpUtc
    ).getTime() <= Date.now();
  }

  isReferralOverdue(
    referral: CareReferral
  ): boolean {
    return Boolean(
      referral.expiresUtc &&
      ['sent', 'viewed'].includes(referral.status) &&
      new Date(referral.expiresUtc).getTime() <= Date.now()
    );
  }

  getContactOutcomeLabel(
    outcome: CareContactOutcome
  ): string {
    return outcome.replace('-', ' ');
  }

  getResponseStatusLabel(
    status: MinistryResponseStatus
  ): string {
    switch (status) {
      case 'needs-review':
        return 'Needs consent review';

      case 'ready-to-refer':
        return 'Ready to refer';

      case 'referred':
        return 'Referral active';

      case 'connected':
        return 'Connected';

      case 'unreachable':
        return 'Person unreachable';

      case 'withdrawn':
        return 'Consent withdrawn';
    }
  }

  getReferralStatusLabel(
    status: CareReferralStatus
  ): string {
    switch (status) {
      case 'draft':
        return 'Draft';

      case 'sent':
        return 'Sent · awaiting response';

      case 'viewed':
        return 'Viewed · awaiting response';

      case 'accepted':
        return 'Accepted · connection pending';

      case 'declined':
        return 'Declined';

      case 'expired':
        return 'Expired · reassignment needed';

      case 'cancelled':
        return 'Returned · reassignment needed';

      case 'connected':
        return 'Connected';
    }
  }

  private toLocalInputValue(
    utcValue: string | null
  ): string {
    if (!utcValue) {
      return '';
    }

    const date = new Date(utcValue);
    const offset = date.getTimezoneOffset();
    const local = new Date(
      date.getTime() - offset * 60_000
    );

    return local.toISOString().slice(0, 16);
  }
}
