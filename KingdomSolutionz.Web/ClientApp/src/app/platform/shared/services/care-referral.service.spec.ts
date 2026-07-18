import {
  TestBed
} from '@angular/core/testing';
import {
  firstValueFrom,
  take
} from 'rxjs';

import {
  AssignmentService
} from './assignment.service';

import {
  CareReferralService
} from './care-referral.service';

describe('CareReferralService', () => {
  let service: CareReferralService;

  beforeEach(() => {
    window.localStorage.removeItem(
      'kingdomos-demo-care-network-v1'
    );

    TestBed.configureTestingModule({
      providers: [
        AssignmentService,
        CareReferralService
      ]
    });

    service = TestBed.inject(
      CareReferralService
    );
  });

  afterEach(() => {
    window.localStorage.removeItem(
      'kingdomos-demo-care-network-v1'
    );
  });

  it('records a sent referral and keeps CTG responsible', async () => {
    const referral = service.sendReferral(
      4101,
      302,
      'Please accept this care referral.'
    );

    expect(referral).toBeDefined();
    expect(referral?.status).toBe('sent');

    const network = await firstValueFrom(
      service
        .getAssignmentNetwork(2001)
        .pipe(take(1))
    );

    expect(
      network.responses.find(
        response => response.id === 4101
      )?.status
    ).toBe('referred');

    expect(
      network.referrals.find(
        item => item.id === referral?.id
      )?.respondedUtc
    ).toBeNull();
  });

  it('requires consent before sharing a response', () => {
    const referral = service.sendReferral(
      4102,
      301,
      'This should not be sent.'
    );

    expect(referral).toBeUndefined();
  });

  it('records staff-verified consent before allowing a referral', async () => {
    service.verifyConsent(
      4102,
      'verbal-confirmation',
      'Michael Davis'
    );

    const referral = service.sendReferral(
      4102,
      301,
      'Consent was confirmed directly before this referral.'
    );

    expect(referral).toBeDefined();

    const network = await firstValueFrom(
      service.getAssignmentNetwork(2001).pipe(take(1))
    );

    const response = network.responses.find(
      item => item.id === 4102
    );

    expect(response?.consentToShare).toBeTrue();
    expect(response?.consentSource)
      .toBe('verbal-confirmation');
    expect(response?.consentRecordedBy)
      .toBe('Michael Davis');
  });

  it('stops an incomplete referral when consent is withdrawn', async () => {
    const referral = service.sendReferral(
      4101,
      302,
      'Please accept this care referral.'
    );

    service.withdrawConsent(4101);

    const network = await firstValueFrom(
      service.getAssignmentNetwork(2001).pipe(take(1))
    );

    expect(
      network.responses.find(item => item.id === 4101)
        ?.consentToShare
    ).toBeFalse();

    expect(
      network.referrals.find(item => item.id === referral?.id)
        ?.status
    ).toBe('cancelled');
  });

  it('tracks viewing, acceptance and confirmed connection', async () => {
    const referral = service.sendReferral(
      4101,
      302,
      'Please accept this care referral.'
    );

    expect(referral).toBeDefined();

    service.markViewed(referral?.id ?? 0);

    service.acceptReferral(
      referral?.id ?? 0,
      'Jordan Ellis',
      'Foundations Group introduction'
    );

    service.confirmConnected(
      referral?.id ?? 0
    );

    const context = await firstValueFrom(
      service
        .getReferralContext(
          referral?.id ?? 0
        )
        .pipe(take(1))
    );

    expect(context?.referral.status)
      .toBe('connected');

    expect(context?.response.status)
      .toBe('connected');

    expect(context?.referral.assignedOwner)
      .toBe('Jordan Ellis');
  });

  it('returns a declined referral to the CTG queue', async () => {
    service.declineReferral(
      5001,
      'Outside our current capacity.'
    );

    const network = await firstValueFrom(
      service
        .getAssignmentNetwork(2001)
        .pipe(take(1))
    );

    expect(
      network.responses.find(
        response => response.id === 4103
      )?.status
    ).toBe('ready-to-refer');

    expect(
      network.referrals.find(
        referral => referral.id === 5001
      )?.status
    ).toBe('declined');
  });

  it('tracks follow-up responsibility, due dates and contact attempts', async () => {
    service.updateCasePlan(
      4101,
      'Care Coordinator',
      'urgent',
      '2026-09-01T15:00:00.000Z'
    );

    const attempt = service.recordContactAttempt(
      4101,
      'text',
      'left-message',
      'Asked Jasmine to call the care team.'
    );

    expect(attempt).toBeDefined();

    const network = await firstValueFrom(
      service.getAssignmentNetwork(2001).pipe(take(1))
    );

    const response = network.responses.find(
      item => item.id === 4101
    );

    expect(response?.assignedCoordinator)
      .toBe('Care Coordinator');
    expect(response?.priority).toBe('urgent');
    expect(response?.contactAttempts.length).toBe(1);
    expect(response?.contactAttempts[0].outcome)
      .toBe('left-message');
  });

  it('records reminders and links reassigned referrals', async () => {
    const firstReferral = service.sendReferral(
      4101,
      302,
      'Please accept this care referral.'
    );

    service.sendReferralReminder(
      firstReferral?.id ?? 0
    );
    service.expireReferral(
      firstReferral?.id ?? 0
    );

    const reassigned = service.sendReferral(
      4101,
      301,
      'Reassigned after the first response window expired.'
    );

    const network = await firstValueFrom(
      service.getAssignmentNetwork(2001).pipe(take(1))
    );

    expect(
      network.referrals.find(
        item => item.id === firstReferral?.id
      )?.reminderCount
    ).toBe(1);
    expect(reassigned?.reassignedFromReferralId)
      .toBe(firstReferral?.id ?? null);
  });

  it('allows a partner to complete or return an accepted handoff', async () => {
    const referral = service.sendReferral(
      4101,
      302,
      'Please accept this care referral.'
    );

    service.acceptReferral(
      referral?.id ?? 0,
      'Jordan Ellis',
      'Foundations group introduction'
    );

    service.confirmConnected(
      referral?.id ?? 0,
      'Greater Atlanta Community Church',
      'Introductory call completed.'
    );

    const context = await firstValueFrom(
      service.getReferralContext(referral?.id ?? 0).pipe(take(1))
    );

    expect(context?.referral.status).toBe('connected');
    expect(context?.referral.connectionConfirmedBy)
      .toBe('Greater Atlanta Community Church');
    expect(context?.response.closedUtc).not.toBeNull();
  });

  it('adds a trusted local care partner that is reusable across assignments', async () => {
    const partner = service.addCarePartner({
      assignmentId: null,
      name: 'Atlanta Hope Church',
      city: 'Atlanta',
      state: 'GA',
      distanceMiles: 4,
      contactName: 'Taylor Brooks',
      contactRole: 'Connections lead',
      contactEmail: 'taylor@atlantahope.example',
      contactPhone: '(404) 555-0199',
      relationship: 'verified-partner',
      serviceArea: 'Metro Atlanta',
      ministries: ['Discipleship'],
      languages: ['English'],
      availability: 'available',
      responseSlaHours: 48,
      notes: 'Verified by the CTG team.'
    });

    const network = await firstValueFrom(
      service.getAssignmentNetwork(2001).pipe(take(1))
    );

    const anotherAssignmentNetwork = await firstValueFrom(
      service.getAssignmentNetwork(2002).pipe(take(1))
    );

    expect(partner.isActive).toBeTrue();
    expect(
      network.partners.some(item => item.id === partner.id)
    ).toBeTrue();
    expect(
      anotherAssignmentNetwork.partners.some(
        item => item.id === partner.id
      )
    ).toBeTrue();
  });
});
