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

export interface AssignmentTask {
  id: number;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: AssignmentTaskStatus;
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

export interface Assignment {
  id: number;
  speakingRequestId: number;

  eventName: string;
  organizationName: string;
  eventType: string;

  city: string;
  state: string;
  venueName: string;

  startDate: string;
  endDate: string;

  coordinator: AssignmentCoordinator;

  contactDirectory:
  AssignmentContactDirectory;

  travelItinerary:
  AssignmentTravelItinerary;

  documentLibrary:
  AssignmentDocumentLibrary;

  status: AssignmentStatus;
  readinessPercentage: number;

  createdUtc: string;
  stages: AssignmentStage[];
}