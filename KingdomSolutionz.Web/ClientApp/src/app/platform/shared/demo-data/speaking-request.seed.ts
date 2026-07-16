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
    venueName: 'New Covenant Global Church',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    ministryRequest:
      'Two leadership sessions and Sunday morning ministry.',
    expectedAttendance: 275,
    travelCovered: true,
    lodgingCovered: true,
    honorariumProvided: true,
    readinessPercentage: 100,
    status: 'awaiting-review',
    submittedUtc: '2026-07-07T16:45:00Z'
  }
];
