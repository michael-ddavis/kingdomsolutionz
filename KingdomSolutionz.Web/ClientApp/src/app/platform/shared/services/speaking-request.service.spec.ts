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
      venueName: 'Hope City Church',
      startDate: '2026-11-13',
      endDate: '2026-11-15',
      ministryRequest:
        'Opening session and Sunday ministry.',
      expectedAttendance: 425,
      travelCovered: true,
      lodgingCovered: true,
      honorariumProvided: true
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
});
