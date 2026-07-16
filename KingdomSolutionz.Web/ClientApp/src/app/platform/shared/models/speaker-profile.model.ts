export interface SpeakerProfileContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface SpeakerProfile {
  name: string;
  ministryTitle: string;
  shortBio: string;
  approvedPhotoUrl: string;
  travelPreferences: string;
  dietaryNeeds: string;
  accessibilityNeeds: string;
  standardDocuments: string[];
  ministryTeamContacts: SpeakerProfileContact[];
  lastUpdatedUtc: string;
}
