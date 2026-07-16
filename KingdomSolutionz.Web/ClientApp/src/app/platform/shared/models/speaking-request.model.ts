export type SpeakingRequestStatus =
  | 'awaiting-review'
  | 'information-needed'
  | 'approved'
  | 'declined';

export type SpeakingRequestCommunicationType =
  | 'submitted'
  | 'information-requested'
  | 'host-responded'
  | 'approved'
  | 'declined';

export interface SpeakingRequestCommunication {
  id: number;
  type: SpeakingRequestCommunicationType;
  message: string;
  actor: string;
  createdUtc: string;
}

export type SpeakingRequestConfirmation =
  | 'yes'
  | 'no'
  | 'not-determined';

export type TravelBookingOwner =
  | 'host'
  | 'ministry-team'
  | 'shared'
  | 'not-determined';

export type AgreementStatus =
  | 'not-started'
  | 'drafted'
  | 'sent'
  | 'signed';

export type PaymentStatus =
  | 'not-applicable'
  | 'not-due'
  | 'pending'
  | 'paid';

export type SpeakingRequestEngagementStatus =
  | 'proposed'
  | 'scheduled'
  | 'rescheduled'
  | 'cancelled';

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
  country: string;
  region: string;
  timeZone: string;
  venueAddress: string;
  venueName: string;

  startDate: string;
  endDate: string;

  ministryRequest: string;
  expectedAttendance: number;

  travelCovered: boolean;
  lodgingCovered: boolean;
  honorariumProvided: boolean;

  travelCoverageStatus:
    SpeakingRequestConfirmation;
  lodgingCoverageStatus:
    SpeakingRequestConfirmation;
  honorariumStatus:
    SpeakingRequestConfirmation;

  travelBookedBy: TravelBookingOwner;
  honorariumAmount: number;
  honorariumCurrency: string;
  paymentStatus: PaymentStatus;
  agreementStatus: AgreementStatus;
  engagementStatus:
    SpeakingRequestEngagementStatus;

  readinessPercentage: number;
  status: SpeakingRequestStatus;

  submittedUtc: string;

  communications:
    SpeakingRequestCommunication[];
}

export type CreateSpeakingRequestInput = Omit<
  SpeakingRequest,
  'id' |
  'readinessPercentage' |
  'status' |
  'submittedUtc' |
  'communications'
>;
