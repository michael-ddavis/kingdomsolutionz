import { Component } from '@angular/core';
import {
  Observable,
  combineLatest,
  map
} from 'rxjs';

import {
  Assignment
} from '../../shared/models/assignment.model';

import {
  CareNetworkState,
  CarePartner,
  CarePartnerAvailability,
  CareReferral,
  MinistryResponse
} from '../../shared/models/care-referral.model';

import {
  AssignmentService
} from '../../shared/services/assignment.service';

import {
  CareReferralService
} from '../../shared/services/care-referral.service';

type CareInboxFilter =
  | 'all'
  | 'action'
  | 'awaiting'
  | 'accepted'
  | 'closed';

interface CareInboxCase {
  response: MinistryResponse;
  assignment: Assignment | undefined;
  referral: CareReferral | undefined;
  partner: CarePartner | undefined;
}

interface CareInboxViewModel {
  cases: CareInboxCase[];
  partners: CarePartner[];
}

@Component({
  standalone: false,
  selector: 'app-care-network-inbox',
  templateUrl: './care-network-inbox.component.html',
  styleUrls: ['./care-network-inbox.component.scss']
})
export class CareNetworkInboxComponent {
  queueFilter: CareInboxFilter = 'all';
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

  readonly viewModel$:
    Observable<CareInboxViewModel> =
    combineLatest([
      this.assignmentService.assignments$,
      this.careReferralService.state$
    ]).pipe(
      map(([assignments, network]) =>
        this.buildViewModel(
          assignments,
          network
        )
      )
    );

  constructor(
    private readonly assignmentService:
      AssignmentService,

    private readonly careReferralService:
      CareReferralService
  ) {}

  setQueueFilter(filter: CareInboxFilter): void {
    this.queueFilter = filter;
  }

  getFilteredCases(
    cases: CareInboxCase[]
  ): CareInboxCase[] {
    return cases.filter(item => {
      switch (this.queueFilter) {
        case 'action':
          return this.needsAction(item);

        case 'awaiting':
          return Boolean(
            item.referral &&
            ['sent', 'viewed'].includes(
              item.referral.status
            )
          );

        case 'accepted':
          return item.referral?.status === 'accepted';

        case 'closed':
          return this.isClosed(item.response);

        case 'all':
        default:
          return true;
      }
    });
  }

  countNeedsAction(cases: CareInboxCase[]): number {
    return cases.filter(item =>
      this.needsAction(item)
    ).length;
  }

  countAwaiting(cases: CareInboxCase[]): number {
    return cases.filter(item =>
      item.referral &&
      ['sent', 'viewed'].includes(
        item.referral.status
      )
    ).length;
  }

  countAccepted(cases: CareInboxCase[]): number {
    return cases.filter(item =>
      item.referral?.status === 'accepted'
    ).length;
  }

  countConnected(cases: CareInboxCase[]): number {
    return cases.filter(item =>
      item.response.status === 'connected'
    ).length;
  }

  countOpen(cases: CareInboxCase[]): number {
    return cases.filter(item =>
      !this.isClosed(item.response)
    ).length;
  }

  isFollowUpDue(response: MinistryResponse): boolean {
    return Boolean(
      response.nextFollowUpUtc &&
      !this.isClosed(response) &&
      new Date(response.nextFollowUpUtc).getTime() <=
        Date.now()
    );
  }

  getStatusLabel(item: CareInboxCase): string {
    if (item.referral) {
      switch (item.referral.status) {
        case 'sent':
          return 'Awaiting church';
        case 'viewed':
          return 'Viewed · awaiting church';
        case 'accepted':
          return 'Accepted · connection pending';
        case 'connected':
          return 'Connected';
        case 'declined':
          return 'Declined · reassign';
        case 'expired':
          return 'Expired · reassign';
        case 'cancelled':
          return 'Returned · reassign';
        case 'draft':
          return 'Draft';
      }
    }

    switch (item.response.status) {
      case 'needs-review':
        return 'Consent review needed';
      case 'ready-to-refer':
        return 'Ready to refer';
      case 'referred':
        return 'Referral active';
      case 'connected':
        return 'Connected';
      case 'unreachable':
        return 'Closed · unreachable';
      case 'withdrawn':
        return 'Closed · consent withdrawn';
    }
  }

  getNextAction(item: CareInboxCase): string {
    if (item.response.status === 'needs-review') {
      return 'Verify consent';
    }

    if (item.response.status === 'ready-to-refer') {
      return 'Select a local partner';
    }

    if (
      item.referral &&
      ['sent', 'viewed'].includes(item.referral.status)
    ) {
      return this.isReferralOverdue(item.referral)
        ? 'Remind or reassign'
        : 'Monitor church response';
    }

    if (item.referral?.status === 'accepted') {
      return 'Confirm local connection';
    }

    return this.isClosed(item.response)
      ? 'No action required'
      : 'Review care record';
  }

  getStatusTone(item: CareInboxCase): string {
    if (item.response.status === 'connected') {
      return 'success';
    }

    if (this.isClosed(item.response)) {
      return 'muted';
    }

    if (this.needsAction(item)) {
      return 'attention';
    }

    return 'active';
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

  addPartner(): void {
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

    this.careReferralService.addCarePartner({
      assignmentId: null,
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

    this.partnerFormVisible = false;
    this.resetPartnerForm();
  }

  updatePartnerAvailability(
    partner: CarePartner,
    event: Event
  ): void {
    const availability =
      (event.target as HTMLSelectElement).value as
        CarePartnerAvailability;

    this.careReferralService.setPartnerAvailability(
      partner.id,
      availability
    );
  }

  private buildViewModel(
    assignments: readonly Assignment[],
    network: CareNetworkState
  ): CareInboxViewModel {
    const cases = network.responses
      .map(response => {
        const referral =
          this.careReferralService
            .getReferralForResponse(
              response.id,
              network
            );

        return {
          response,
          assignment: assignments.find(
            item => item.id === response.assignmentId
          ),
          referral,
          partner: referral
            ? network.partners.find(
                item => item.id === referral.partnerId
              )
            : undefined
        };
      })
      .sort((a, b) => {
        const priorityDifference =
          Number(this.needsAction(b)) -
          Number(this.needsAction(a));

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return b.response.receivedUtc.localeCompare(
          a.response.receivedUtc
        );
      });

    return {
      cases,
      partners: network.partners
        .filter(partner =>
          partner.relationship === 'verified-partner'
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  private needsAction(item: CareInboxCase): boolean {
    return [
      'needs-review',
      'ready-to-refer'
    ].includes(item.response.status) ||
      this.isFollowUpDue(item.response) ||
      Boolean(
        item.referral &&
        this.isReferralOverdue(item.referral)
      );
  }

  private isReferralOverdue(
    referral: CareReferral
  ): boolean {
    return Boolean(
      referral.expiresUtc &&
      ['sent', 'viewed'].includes(referral.status) &&
      new Date(referral.expiresUtc).getTime() <= Date.now()
    );
  }

  private isClosed(response: MinistryResponse): boolean {
    return [
      'connected',
      'unreachable',
      'withdrawn'
    ].includes(response.status);
  }

  private resetPartnerForm(): void {
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
}
