import {
  firstValueFrom,
  take
} from 'rxjs';

import {
  SpeakingRequestService
} from './speaking-request.service';

describe('SpeakingRequestService demo queue', () => {
  let service: SpeakingRequestService;

  beforeEach(() => {
    window.localStorage.removeItem(
      'kingdomos-demo-speaking-requests-v2'
    );
    service = new SpeakingRequestService();
  });

  it('starts with one complete request awaiting review', async () => {
    const requests = await firstValueFrom(
      service.speakingRequests$.pipe(
        take(1)
      )
    );

    expect(requests.length).toBe(1);
    expect(requests[0].status)
      .toBe('awaiting-review');
    expect(requests[0].readinessPercentage)
      .toBe(100);
  });

  it('adds a new host submission to the review queue', async () => {
    const created = service.addSpeakingRequest({
      organizationName: 'Hope City Church',
      eventName: 'Renewal Weekend',
      eventType: 'Conference',
      contactName: 'Jordan Brooks',
      contactEmail:
        'jordan@hopecity.example',
      contactPhone: '(305) 555-0188',
      city: 'Miami',
      state: 'FL',
      country: 'United States',
      region: 'Florida',
      timeZone: 'America/New_York',
      venueAddress: '100 Hope Way, Miami, FL',
      venueName: 'Hope City Church',
      startDate: '2026-11-13',
      endDate: '2026-11-15',
      ministryRequest:
        'Opening session and Sunday ministry.',
      expectedAttendance: 425,
      travelCovered: true,
      lodgingCovered: true,
      honorariumProvided: true,
      travelCoverageStatus: 'yes',
      lodgingCoverageStatus: 'yes',
      honorariumStatus: 'yes',
      travelBookedBy: 'host',
      honorariumAmount: 2000,
      honorariumCurrency: 'USD',
      paymentStatus: 'not-due',
      agreementStatus: 'not-started',
      engagementStatus: 'proposed'
    });

    const requests = await firstValueFrom(
      service.speakingRequests$.pipe(
        take(1)
      )
    );

    expect(created.status)
      .toBe('awaiting-review');
    expect(requests.length).toBe(2);
    expect(requests[0].id)
      .toBe(created.id);
  });

  it('records an information request and the host resubmission', async () => {
    service.requestInformation(
      1003,
      'Please confirm who will book travel.'
    );

    service.submitHostResponse(
      1003,
      'The host will book travel.',
      { travelBookedBy: 'host' }
    );

    const request = await firstValueFrom(
      service.getSpeakingRequest(1003).pipe(take(1))
    );

    expect(request?.status).toBe('awaiting-review');
    expect(request?.communications.map(item => item.type))
      .toContain('information-requested');
    expect(request?.communications.map(item => item.type))
      .toContain('host-responded');
  });
});
