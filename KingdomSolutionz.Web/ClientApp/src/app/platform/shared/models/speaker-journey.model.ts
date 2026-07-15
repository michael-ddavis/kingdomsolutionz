export type SpeakerJourneyStatus =
  | 'active'
  | 'completed'
  | 'cancelled';

export type SpeakerJourneyStageStatus =
  | 'complete'
  | 'current'
  | 'upcoming'
  | 'blocked';

export type SpeakerJourneyTaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete'
  | 'blocked';

export interface SpeakerJourneyTask {
  id: number;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: SpeakerJourneyTaskStatus;
}

export interface SpeakerJourneyStage {
  id: string;
  name: string;
  description: string;
  status: SpeakerJourneyStageStatus;
  tasks: SpeakerJourneyTask[];
}

export interface AssignmentCoordinator {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface SpeakerJourney {
  id: number;
  speakingRequestId: number;
  coordinator: AssignmentCoordinator;
  
  eventName: string;
  organizationName: string;
  eventType: string;

  city: string;
  state: string;
  venueName: string;

  startDate: string;
  endDate: string;

  status: SpeakerJourneyStatus;
  readinessPercentage: number;

  createdUtc: string;
  stages: SpeakerJourneyStage[];
}