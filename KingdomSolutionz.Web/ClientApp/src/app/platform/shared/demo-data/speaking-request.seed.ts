import {
  SpeakingRequest
} from '../models/speaking-request.model';

export const SEEDED_SPEAKING_REQUESTS:
  readonly SpeakingRequest[] = [
  {
    id: 1001,
    organizationName: 'Richmond Worship Summit',
    eventName: 'Awaken Richmond 2026',
    eventType: 'Worship and Prayer Gathering',
    contactName: 'Pastor Naomi Brooks',
    contactEmail: 'naomi@awakenrichmond.example',
    contactPhone: '(804) 555-0198',
    city: 'Richmond',
    state: 'VA',
    venueName: 'Richmond Convention Center',
    startDate: '2026-09-25',
    endDate: '2026-09-26',
    ministryRequest:
      'Keynote ministry session and Saturday evening prayer gathering.',
    expectedAttendance: 850,
    travelCovered: true,
    lodgingCovered: true,
    honorariumProvided: true,
    readinessPercentage: 87,
    status: 'awaiting-review',
    submittedUtc: '2026-07-13T14:30:00Z'
  },
  {
    id: 1002,
    organizationName: 'Greater Hope Worship Center',
    eventName: 'Women of Fire Conference',
    eventType: 'Women’s Conference',
    contactName: 'Elder Rebecca Thomas',
    contactEmail: 'rebecca@greaterhope.example',
    contactPhone: '(704) 555-0131',
    city: 'Charlotte',
    state: 'NC',
    venueName: 'Greater Hope Worship Center',
    startDate: '2026-10-16',
    endDate: '2026-10-18',
    ministryRequest:
      'Friday evening opening session and Saturday leadership intensive.',
    expectedAttendance: 420,
    travelCovered: true,
    lodgingCovered: true,
    honorariumProvided: true,
    readinessPercentage: 72,
    status: 'information-needed',
    submittedUtc: '2026-07-12T18:15:00Z'
  },
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
    readinessPercentage: 94,
    status: 'approved',
    submittedUtc: '2026-07-07T16:45:00Z'
  },
  {
    id: 1004,
    organizationName: 'River City Fellowship',
    eventName: 'Regional Prophetic Gathering',
    eventType: 'Prophetic Gathering',
    contactName: 'Minister Caleb Reed',
    contactEmail: 'caleb@rivercity.example',
    contactPhone: '(757) 555-0104',
    city: 'Norfolk',
    state: 'VA',
    venueName: 'River City Fellowship',
    startDate: '2026-11-06',
    endDate: '2026-11-07',
    ministryRequest:
      'Saturday evening ministry and leadership prayer session.',
    expectedAttendance: 190,
    travelCovered: false,
    lodgingCovered: true,
    honorariumProvided: false,
    readinessPercentage: 48,
    status: 'awaiting-review',
    submittedUtc: '2026-07-05T11:20:00Z'
  }
];
