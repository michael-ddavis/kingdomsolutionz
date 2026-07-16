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
    ).toBe('expired');
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
});
