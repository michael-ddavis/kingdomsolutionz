import {
  firstValueFrom,
  take
} from 'rxjs';

import {
  SpeakingRequest
} from '../models/speaking-request.model';

import {
  SEEDED_SPEAKING_REQUESTS
} from '../demo-data/speaking-request.seed';

import {
  AssignmentService
} from './assignment.service';

describe('AssignmentService invitation prefill', () => {
  let service: AssignmentService;

  beforeEach(() => {
    window.localStorage.removeItem(
      'kingdomos-demo-assignments-v2'
    );
    service = new AssignmentService();
  });

  it('starts with no assignment before a request is approved', async () => {
    const assignments = await firstValueFrom(
      service
        .assignments$
        .pipe(take(1))
    );

    expect(assignments).toEqual([]);
  });

  it('creates the demo assignment from the pending request only after approval', () => {
    const request =
      SEEDED_SPEAKING_REQUESTS[0];

    expect(request.status)
      .toBe('awaiting-review');

    const assignment =
      service.createOrGetAssignment({
        ...request,
        status: 'approved'
      });

    expect(assignment.id).toBe(2001);
    expect(assignment.eventName)
      .toBe('Kingdom Leadership Intensive');
    expect(
      assignment.invitation
        .expectedAttendance
    ).toBe(275);
    expect(
      assignment.invitation
        .ministryRequest
    ).toContain('Two leadership sessions');
  });

  it('carries the primary host contact into the assignment once', () => {
    const request:
      SpeakingRequest = {
      ...SEEDED_SPEAKING_REQUESTS[0],
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
        '2026-07-16T12:00:00.000Z',
      communications: []
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
        ...SEEDED_SPEAKING_REQUESTS[0],
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
          '2026-07-16T13:00:00.000Z',
        communications: []
      });

    expect(assignment.invitation)
      .toEqual(jasmine.objectContaining({
        ministryRequest:
          'Friday keynote and prayer ministry.',
        expectedAttendance: 500,
        travelCovered: true,
        lodgingCovered: false,
        honorariumProvided: true,
        submittedUtc:
          '2026-07-16T13:00:00.000Z'
      }));
  });

  it('writes host coordination details into travel and contacts', () => {
    const assignment = service.createOrGetAssignment({
      ...SEEDED_SPEAKING_REQUESTS[0],
      status: 'approved'
    });

    service.requestHostCoordination(assignment.id);
    service.submitHostCoordination(assignment.id, {
      outboundFlight: {
        type: 'outbound',
        airline: 'Delta',
        flightNumber: 'DL 241',
        confirmationNumber: 'ABC123',
        departureAirport: 'RIC',
        arrivalAirport: 'ATL',
        departureDate: '2026-08-27',
        departureTime: '10:00',
        arrivalDate: '2026-08-27',
        arrivalTime: '11:45',
        seat: '2A',
        notes: ''
      },
      returnFlight: {
        type: 'return',
        airline: 'Delta',
        flightNumber: 'DL 310',
        confirmationNumber: 'ABC123',
        departureAirport: 'ATL',
        arrivalAirport: 'RIC',
        departureDate: '2026-08-31',
        departureTime: '14:00',
        arrivalDate: '2026-08-31',
        arrivalTime: '15:35',
        seat: '2A',
        notes: ''
      },
      hotel: {
        hotelName: 'Hyatt Regency',
        confirmationNumber: 'HTL123',
        address: '265 Peachtree Street NE',
        city: 'Atlanta',
        state: 'GA',
        postalCode: '30303',
        checkInDate: '2026-08-27',
        checkInTime: '15:00',
        checkOutDate: '2026-08-31',
        checkOutTime: '11:00',
        phone: '+1 404 555 0190',
        notes: ''
      },
      groundTransportation: {
        arrivalPickupContact: 'Jordan Ellis',
        arrivalPickupPhone: '+1 404 555 0100',
        arrivalPickupInstructions: 'Meet at baggage claim.',
        localTransportationDetails: 'Host vehicle',
        departurePickupContact: 'Jordan Ellis',
        departurePickupPhone: '+1 404 555 0100',
        departurePickupInstructions: 'Hotel lobby at 8:00 AM.'
      },
      travelContact: {
        name: 'Jordan Ellis',
        role: 'Travel coordinator',
        phone: '+1 404 555 0100',
        email: 'jordan@example.com'
      },
      mediaContact: { name: '', role: '', phone: '', email: '' },
      emergencyContact: { name: '', role: '', phone: '', email: '' },
      eventSchedule: 'Friday arrival; Sunday ministry.',
      prayerFocus: 'Leaders and families',
      promotionalRequirements: 'Use approved photo.',
      hostNotes: ''
    });

    service.getAssignment(assignment.id)
      .pipe(take(1))
      .subscribe(updated => {
        expect(updated?.hostCoordination.status).toBe('submitted');
        expect(updated?.travelItinerary.outboundFlight.flightNumber).toBe('DL 241');
        expect(updated?.travelItinerary.returnFlight.flightNumber).toBe('DL 310');
        expect(updated?.travelItinerary.hotel.hotelName).toBe('Hyatt Regency');
        expect(updated?.contactDirectory.travelContact.name).toBe('Jordan Ellis');
      });
  });

  it('allows multiple partially completed stages to remain in progress', async () => {
    const assignment =
      service.createOrGetAssignment({
        ...SEEDED_SPEAKING_REQUESTS[0],
        status: 'approved'
      });

    service.updateTaskStatus(
      assignment.id,
      'host-readiness',
      8,
      'complete'
    );

    service.updateTaskStatus(
      assignment.id,
      'promotion',
      11,
      'complete'
    );

    const updated =
      await firstValueFrom(
        service
          .getAssignment(assignment.id)
          .pipe(take(1))
      );

    expect(
      updated?.stages.find(
        stage => stage.id === 'travel'
      )?.status
    ).toBe('current');

    expect(
      updated?.stages.find(
        stage => stage.id === 'host-readiness'
      )?.status
    ).toBe('current');

    expect(
      updated?.stages.find(
        stage => stage.id === 'promotion'
      )?.status
    ).toBe('current');
  });
});
