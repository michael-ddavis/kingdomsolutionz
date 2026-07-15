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

export interface Assignment {
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

  status: AssignmentStatus;
  readinessPercentage: number;

  createdUtc: string;
  stages: AssignmentStage[];
}