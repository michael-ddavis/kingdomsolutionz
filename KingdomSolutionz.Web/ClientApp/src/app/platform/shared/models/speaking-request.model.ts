export type SpeakingRequestStatus =
  | 'awaiting-review'
  | 'information-needed'
  | 'approved'
  | 'declined';

export interface SpeakingRequest {
  id: number;
  organizationName: string;
  eventName: string;
  eventType: string;

  contactName: string;
  contactEmail: string;
  contactPhone: string;

  city: string;
  state: string;
  venueName: string;

  startDate: string;
  endDate: string;

  ministryRequest: string;
  expectedAttendance: number;

  travelCovered: boolean;
  lodgingCovered: boolean;
  honorariumProvided: boolean;

  readinessPercentage: number;
  status: SpeakingRequestStatus;

  submittedUtc: string;
}