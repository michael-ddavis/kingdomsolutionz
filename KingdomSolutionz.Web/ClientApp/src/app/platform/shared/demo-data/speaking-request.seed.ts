import {
  SpeakingRequest
} from '../models/speaking-request.model';

export const SEEDED_SPEAKING_REQUESTS:
  readonly SpeakingRequest[] = [
  {
    id: 1003,
    organizationName: 'New Covenant Global Church',
    eventName: 'Kingdom Leadership Intensive',
    eventType: 'Leadership Intensive',
    contactName: 'Bishop Aaron Williams',
    contactEmail: 'aaron@newcovenantglobal.example',
    contactPhone: '(404) 555-0175',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    region: 'Georgia',
    timeZone: 'America/New_York',
    venueAddress:
      '1450 Covenant Way, Atlanta, GA 30303',
    venueName: 'New Covenant Global Church',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    ministryRequest:
      'Two leadership sessions and Sunday morning ministry.',
    expectedAttendance: 275,
    travelCovered: true,
    lodgingCovered: true,
    honorariumProvided: true,
    travelCoverageStatus: 'yes',
    lodgingCoverageStatus: 'yes',
    honorariumStatus: 'yes',
    travelBookedBy: 'host',
    honorariumAmount: 2500,
    honorariumCurrency: 'USD',
    paymentStatus: 'not-due',
    agreementStatus: 'not-started',
    engagementStatus: 'proposed',
    readinessPercentage: 100,
    status: 'awaiting-review',
    submittedUtc: '2026-07-07T16:45:00Z',
    communications: [
      {
        id: 1,
        type: 'submitted',
        message:
          'Speaking invitation submitted for ministry-team review.',
        actor: 'Bishop Aaron Williams',
        createdUtc:
          '2026-07-07T16:45:00Z'
      }
    ]
  }
];
