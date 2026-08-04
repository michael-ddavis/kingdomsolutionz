import { WorkspaceId } from './workspace.model';

export type OperationsSupportCategory =
  | 'access'
  | 'workflow'
  | 'data'
  | 'training'
  | 'other';

export type OperationsSupportPriority =
  | 'normal'
  | 'high'
  | 'urgent';

export type OperationsSupportStatus =
  | 'new'
  | 'in-progress'
  | 'waiting'
  | 'resolved';

export interface OperationsSupportRequest {
  id: number;
  workspaceId: WorkspaceId;
  title: string;
  detail: string;
  category: OperationsSupportCategory;
  priority: OperationsSupportPriority;
  status: OperationsSupportStatus;
  requestedBy: string;
  owner: string;
  createdUtc: string;
  updatedUtc: string;
}

export interface CreateOperationsSupportRequestInput {
  workspaceId: WorkspaceId;
  title: string;
  detail: string;
  category: OperationsSupportCategory;
  priority: OperationsSupportPriority;
}
