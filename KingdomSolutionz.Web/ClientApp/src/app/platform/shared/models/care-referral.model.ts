export type CarePartnerAvailability =
  | 'available'
  | 'limited'
  | 'unavailable';

export type CareCasePriority =
  | 'standard'
  | 'urgent';

export type CareContactMethod =
  | 'email'
  | 'phone'
  | 'text';

export type CareContactOutcome =
  | 'reached'
  | 'left-message'
  | 'no-answer'
  | 'wrong-contact';

export type MinistryResponseStatus =
  | 'needs-review'
  | 'ready-to-refer'
  | 'referred'
  | 'connected'
  | 'unreachable'
  | 'withdrawn';

export type MinistryResponseConsentSource =
  | 'qr-form'
  | 'verbal-confirmation'
  | 'written-confirmation'
  | 'not-recorded';

export type CareReferralStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'connected';

export interface CareContactAttempt {
  id: number;
  responseId: number;
  method: CareContactMethod;
  outcome: CareContactOutcome;
  note: string;
  createdUtc: string;
  createdBy: string;
}

export interface CarePartner {
  id: number;
  assignmentId: number;

  name: string;
  city: string;
  state: string;
  distanceMiles: number;

  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;

  relationship:
    | 'host-church'
    | 'verified-partner';

  serviceArea: string;
  ministries: string[];
  languages: string[];

  availability: CarePartnerAvailability;
  responseSlaHours: number;
  notes: string;
  isActive: boolean;
}

export interface MinistryResponse {
  id: number;
  assignmentId: number;

  personName: string;
  email: string;
  phone: string;
  preferredContactMethod:
    'email' | 'phone' | 'text';

  city: string;
  state: string;
  postalCode: string;

  responseType: string;
  requestedSupport: string;

  consentToShare: boolean;
  consentSource: MinistryResponseConsentSource;
  consentRecordedUtc: string | null;
  consentRecordedBy: string;
  receivedUtc: string;
  status: MinistryResponseStatus;

  assignedCoordinator: string;
  priority: CareCasePriority;
  nextFollowUpUtc: string | null;
  lastContactUtc: string | null;
  contactAttempts: CareContactAttempt[];
  closedUtc: string | null;
  closureNote: string;
}

export type CreateMinistryResponseInput = Omit<
  MinistryResponse,
  | 'id'
  | 'receivedUtc'
  | 'status'
  | 'consentSource'
  | 'consentRecordedUtc'
  | 'consentRecordedBy'
  | 'assignedCoordinator'
  | 'priority'
  | 'nextFollowUpUtc'
  | 'lastContactUtc'
  | 'contactAttempts'
  | 'closedUtc'
  | 'closureNote'
>;

export type CreateCarePartnerInput = Omit<
  CarePartner,
  'id' | 'isActive'
>;

export interface CareReferral {
  id: number;
  assignmentId: number;
  responseId: number;
  partnerId: number;

  status: CareReferralStatus;
  personalMessage: string;

  sentUtc: string | null;
  viewedUtc: string | null;
  respondedUtc: string | null;
  connectedUtc: string | null;
  expiresUtc: string | null;
  lastReminderUtc: string | null;
  reminderCount: number;
  reassignedFromReferralId: number | null;

  assignedOwner: string;
  nextStep: string;
  declineReason: string;
  connectionConfirmedBy: string;
  connectionNote: string;
}

export interface CareNetworkState {
  partners: CarePartner[];
  responses: MinistryResponse[];
  referrals: CareReferral[];
}

export interface CareReferralContext {
  referral: CareReferral;
  response: MinistryResponse;
  partner: CarePartner;
}
