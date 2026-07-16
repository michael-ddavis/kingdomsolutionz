import {
  firstValueFrom,
  take
} from 'rxjs';

import {
  SpeakingRequest
} from '../models/speaking-request.model';

import {
  AssignmentService
} from './assignment.service';

describe('AssignmentService invitation prefill', () => {
  let service: AssignmentService;

  beforeEach(() => {
    service = new AssignmentService();
  });

  it('builds the seeded assignment from the shared request record', async () => {
    const assignment = await firstValueFrom(
      service
        .getAssignment(2001)
        .pipe(take(1))
    );

    expect(assignment).toBeDefined();
    expect(assignment?.eventName)
      .toBe('Kingdom Leadership Intensive');
    expect(
      assignment?.invitation
        .expectedAttendance
    ).toBe(275);
    expect(
      assignment?.invitation
        .ministryRequest
    ).toContain('Two leadership sessions');
  });

  it('carries the primary host contact into the assignment once', () => {
    const request:
      SpeakingRequest = {
      id: 1099,
      organizationName:
        'Hope Community Church',
      eventName: 'Community Renewal Weekend',
      eventType: 'Weekend Gathering',
      contactName: 'Taylor James',
      contactEmail:
        'taylor@hopecommunity.example',
      contactPhone: '(305) 555-0101',
      city: 'Miami',
      state: 'FL',
      venueName: 'Hope Community Church',
      startDate: '2026-09-18',
      endDate: '2026-09-20',
      ministryRequest:
        'Opening session and Sunday ministry.',
      expectedAttendance: 350,
      travelCovered: true,
      lodgingCovered: true,
      honorariumProvided: false,
      readinessPercentage: 86,
      status: 'approved',
      submittedUtc:
        '2026-07-16T12:00:00.000Z'
    };

    const assignment =
      service.createOrGetAssignment(request);

    const hostContact =
      assignment.contactDirectory
        .hostCoordinator;

    expect(hostContact.name)
      .toBe(request.contactName);
    expect(hostContact.email)
      .toBe(request.contactEmail);
    expect(hostContact.phone)
      .toBe(request.contactPhone);
    expect(hostContact.organization)
      .toBe(request.organizationName);
    expect(hostContact.source)
      .toBe('speaking-request');
    expect(
      assignment.contactDirectory
        .readinessPercentage
    ).toBe(20);
  });

  it('preserves every approved invitation commitment', () => {
    const assignment =
      service.createOrGetAssignment({
        id: 1100,
        organizationName: 'City Church',
        eventName: 'Prayer Summit',
        eventType: 'Prayer Gathering',
        contactName: 'Morgan Reed',
        contactEmail:
          'morgan@citychurch.example',
        contactPhone: '(407) 555-0114',
        city: 'Orlando',
        state: 'FL',
        venueName: 'City Church',
        startDate: '2026-10-09',
        endDate: '2026-10-10',
        ministryRequest:
          'Friday keynote and prayer ministry.',
        expectedAttendance: 500,
        travelCovered: true,
        lodgingCovered: false,
        honorariumProvided: true,
        readinessPercentage: 80,
        status: 'approved',
        submittedUtc:
          '2026-07-16T13:00:00.000Z'
      });

    expect(assignment.invitation)
      .toEqual({
        ministryRequest:
          'Friday keynote and prayer ministry.',
        expectedAttendance: 500,
        travelCovered: true,
        lodgingCovered: false,
        honorariumProvided: true,
        submittedUtc:
          '2026-07-16T13:00:00.000Z'
      });
  });
});
