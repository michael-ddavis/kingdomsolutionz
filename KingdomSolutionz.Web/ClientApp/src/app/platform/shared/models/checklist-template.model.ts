import { WorkspaceId } from './workspace.model';

export interface ChecklistTemplateTask {
  id: number;
  title: string;
  description: string;
  defaultOwner: string;
  dueOffsetDays: number;
}

export interface ChecklistTemplate {
  id: number;
  workspaceId: WorkspaceId;
  name: string;
  description: string;
  category: 'assignment' | 'event' | 'administration' | 'follow-up';
  tasks: ChecklistTemplateTask[];
  active: boolean;
  createdUtc: string;
  updatedUtc: string;
}

export interface CreateChecklistTemplateInput {
  workspaceId: WorkspaceId;
  name: string;
  description: string;
  category: ChecklistTemplate['category'];
  taskTitles: readonly string[];
}
