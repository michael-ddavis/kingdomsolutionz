export type AssignmentStatus =
  | 'active'
  | 'completed'
  | 'cancelled';

export type AssignmentStageStatus =
  | 'complete'
  | 'current'
  | 'upcoming'
  | 'blocked';

export type AssignmentTaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete'
  | 'blocked';

export interface AssignmentTaskComment {
  id: number;
  author: string;
  message: string;
  createdUtc: string;
}

export interface AssignmentTask {
  id: number;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: AssignmentTaskStatus;
  comments?: AssignmentTaskComment[];

}

export interface AssignmentStage {
  id: string;
  name: string;
  description: string;
  status: AssignmentStageStatus;
  tasks: AssignmentTask[];
}

export interface AssignmentCoordinator {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export type AssignmentDataSource =
  | 'speaking-request'
  | 'assignment';

export interface AssignmentInvitationSnapshot {
  ministryRequest: string;
  expectedAttendance: number;

  travelCovered: boolean;
  lodgingCovered: boolean;
  honorariumProvided: boolean;

  travelCoverageStatus:
    import('./speaking-request.model')
      .SpeakingRequestConfirmation;
  lodgingCoverageStatus:
    import('./speaking-request.model')
      .SpeakingRequestConfirmation;
  honorariumStatus:
    import('./speaking-request.model')
      .SpeakingRequestConfirmation;

  travelBookedBy:
    import('./speaking-request.model')
      .TravelBookingOwner;
  honorariumAmount: number;
  honorariumCurrency: string;
  paymentStatus:
    import('./speaking-request.model')
      .PaymentStatus;
  agreementStatus:
    import('./speaking-request.model')
      .AgreementStatus;
  engagementStatus:
    import('./speaking-request.model')
      .SpeakingRequestEngagementStatus;

  submittedUtc: string;
}

export interface AssignmentFlight {
  type: 'outbound' | 'return';

  airline: string;
  flightNumber: string;
  confirmationNumber: string;

  departureAirport: string;
  arrivalAirport: string;

  departureDate: string;
  departureTime: string;

  arrivalDate: string;
  arrivalTime: string;

  seat: string;
  notes: string;
}

export interface AssignmentHotel {
  hotelName: string;
  confirmationNumber: string;

  address: string;
  city: string;
  state: string;
  postalCode: string;

  checkInDate: string;
  checkInTime: string;

  checkOutDate: string;
  checkOutTime: string;

  phone: string;
  notes: string;
}

export interface AssignmentGroundTransportation {
  arrivalPickupContact: string;
  arrivalPickupPhone: string;
  arrivalPickupInstructions: string;

  localTransportationDetails: string;

  departurePickupContact: string;
  departurePickupPhone: string;
  departurePickupInstructions: string;
}

export interface AssignmentTravelItinerary {
  outboundFlight: AssignmentFlight;
  returnFlight: AssignmentFlight;

  hotel: AssignmentHotel;

  groundTransportation:
  AssignmentGroundTransportation;

  generalNotes: string;

  readinessPercentage: number;
  lastUpdatedUtc: string | null;
}

export type AssignmentHostCoordinationStatus =
  | 'not-requested'
  | 'requested'
  | 'in-progress'
  | 'submitted'
  | 'reviewed';

export interface AssignmentHostCoordination {
  status: AssignmentHostCoordinationStatus;
  requestedUtc: string | null;
  lastSavedUtc: string | null;
  submittedUtc: string | null;
  reviewedUtc: string | null;
  completionPercentage: number;
  eventSchedule: string;
  prayerFocus: string;
  promotionalRequirements: string;
  hostNotes: string;
}

export interface AssignmentHostCoordinationInput {
  outboundFlight: AssignmentFlight;
  returnFlight: AssignmentFlight;
  hotel: AssignmentHotel;
  groundTransportation:
    AssignmentGroundTransportation;
  eventSchedule: string;
  prayerFocus: string;
  promotionalRequirements: string;
  hostNotes: string;
  generalTravelNotes: string;
  hostPastor: AssignmentHostLocalContact;
  hostCoordinator: AssignmentHostLocalContact;
  travelContact: AssignmentHostLocalContact;
  mediaContact: AssignmentHostLocalContact;
  emergencyContact: AssignmentHostLocalContact;
}

export interface AssignmentHostLocalContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export type AssignmentDocumentCategory =
  | 'contract'
  | 'event-schedule'
  | 'travel-confirmation'
  | 'promotional-asset'
  | 'response-resource'
  | 'host-packet'
  | 'sermon-notes'
  | 'other';

export interface AssignmentDocument {
  id: number;

  category: AssignmentDocumentCategory;

  title: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;

  uploadedBy: string;
  uploadedUtc: string;

  notes: string;

  /**
   * Temporary browser URL for the demo.
   * This will eventually be replaced by a permanent
   * Azure Blob Storage URL.
   */
  objectUrl: string;
}

export interface AssignmentDocumentLibrary {
  documents: AssignmentDocument[];

  readinessPercentage: number;
  lastUpdatedUtc: string | null;
}

export type AssignmentContactCategory =
  | 'host-pastor'
  | 'host-coordinator'
  | 'travel'
  | 'media'
  | 'emergency';

export type AssignmentContactMethod =
  | ''
  | 'phone'
  | 'text'
  | 'email';

export interface AssignmentContact {
  category: AssignmentContactCategory;

  source: AssignmentDataSource;

  name: string;
  role: string;
  organization: string;

  phone: string;
  email: string;

  preferredContactMethod:
  AssignmentContactMethod;

  notes: string;
}

export interface AssignmentContactDirectory {
  hostPastor: AssignmentContact;
  hostCoordinator: AssignmentContact;
  travelContact: AssignmentContact;
  mediaContact: AssignmentContact;
  emergencyContact: AssignmentContact;

  readinessPercentage: number;
  lastUpdatedUtc: string | null;
}

export type AssignmentActivityType =
  | 'assignment-created'
  | 'travel-updated'
  | 'contacts-updated'
  | 'document-uploaded'
  | 'document-removed'
  | 'task-updated'
  | 'comment-added'
  | 'referral-sent'
  | 'referral-viewed'
  | 'referral-accepted'
  | 'referral-declined'
  | 'person-connected'
  | 'host-coordination-requested'
  | 'host-coordination-submitted'
  | 'host-coordination-reviewed'
  | 'assignment-closed'
  | 'note-added';

export type AssignmentActivityTone =
  | 'neutral'
  | 'success'
  | 'attention';

export type AssignmentActivitySection =
  | 'overview'
  | 'checklist'
  | 'travel'
  | 'contacts'
  | 'documents'
  | 'responses'
  | 'follow-up';

export interface AssignmentActivityItem {
  id: number;

  type: AssignmentActivityType;
  tone: AssignmentActivityTone;

  title: string;
  description: string;

  actor: string;
  createdUtc: string;

  section:
  AssignmentActivitySection;
}

export interface AssignmentActivityLog {
  items: AssignmentActivityItem[];
  lastUpdatedUtc: string | null;
}

export type AssignmentCloseoutStatus =
  | 'not-started'
  | 'in-progress'
  | 'closed';

export interface AssignmentCloseout {
  status: AssignmentCloseoutStatus;
  actualAttendance: number;
  ministryOutcomes: string;
  testimonies: string;
  outstandingExpenses: string;
  honorariumReconciled: boolean;
  hostFeedback: string;
  thankYouSent: boolean;
  archivedUtc: string | null;
  lastUpdatedUtc: string | null;
}

export interface Assignment {
  id: number;
  speakingRequestId: number;

  eventName: string;
  organizationName: string;
  eventType: string;

  city: string;
  state: string;
  country: string;
  region: string;
  timeZone: string;
  venueAddress: string;
  venueName: string;

  startDate: string;
  endDate: string;

  invitation:
    AssignmentInvitationSnapshot;

  coordinator: AssignmentCoordinator;

  contactDirectory:
  AssignmentContactDirectory;

  travelItinerary:
  AssignmentTravelItinerary;

  hostCoordination:
  AssignmentHostCoordination;

  documentLibrary:
  AssignmentDocumentLibrary;

  activityLog:
  AssignmentActivityLog;

  closeout: AssignmentCloseout;

  status: AssignmentStatus;
  readinessPercentage: number;

  createdUtc: string;
  stages: AssignmentStage[];
}
