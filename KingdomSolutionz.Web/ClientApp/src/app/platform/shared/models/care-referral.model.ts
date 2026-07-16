export type CarePartnerAvailability =
  | 'available'
  | 'limited';

export type MinistryResponseStatus =
  | 'needs-review'
  | 'ready-to-refer'
  | 'referred'
  | 'connected';

export type CareReferralStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'connected';

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

  relationship:
    | 'host-church'
    | 'verified-partner';

  serviceArea: string;
  ministries: string[];
  languages: string[];

  availability: CarePartnerAvailability;
  responseSlaHours: number;
}

export interface MinistryResponse {
  id: number;
  assignmentId: number;

  personName: string;
  email: string;
  phone: string;

  city: string;
  state: string;
  postalCode: string;

  responseType: string;
  requestedSupport: string;

  consentToShare: boolean;
  receivedUtc: string;
  status: MinistryResponseStatus;
}

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

  assignedOwner: string;
  nextStep: string;
  declineReason: string;
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
