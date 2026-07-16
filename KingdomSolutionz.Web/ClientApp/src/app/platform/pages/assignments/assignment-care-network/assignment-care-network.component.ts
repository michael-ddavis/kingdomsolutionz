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
  CareNetworkState,
  CarePartner,
  CareReferral,
  CareReferralStatus,
  MinistryResponse,
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
    'Jasmine asked to join a local foundations group and gave permission for ACT to share her contact details. Please confirm whether your team can receive this referral.';

  emailPreviewVisible = false;
  sendError = '';

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
      `${response.personName} requested ${response.responseType.toLowerCase()} support and gave permission for ACT to share contact details. Please confirm whether your team can receive this referral.`;
  }

  selectPartner(
    partner: CarePartner
  ): void {
    this.selectedPartnerId = partner.id;
    this.sendError = '';
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

  resetDemo(): void {
    this.careReferralService.resetDemo();
    this.selectedResponseId = 4101;
    this.selectedPartnerId = 302;
    this.emailPreviewVisible = false;
    this.sendError = '';
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
        referral.status !== 'declined'
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

      case 'connected':
        return 'Connected';
    }
  }
}
