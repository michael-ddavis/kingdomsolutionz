import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Workspace, WorkspaceId } from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  readonly workspaces: readonly Workspace[] = [
    {
      id: 'all',
      name: 'All Engagements',
      shortName: 'All Engagements',
      kind: 'network',
      description: 'A combined view of invitations, approved engagements, readiness and closeout.'
    },
    {
      id: 'apostle-cynthia',
      name: 'Cynthia Thompson Global',
      shortName: 'CTG',
      kind: 'itinerant-ministry',
      description: 'Speaking invitations, assignments, host coordination, travel and ministry follow-through.'
    },
    {
      id: 'jpp',
      name: 'JPP Ministry Engagements',
      shortName: 'JPP',
      kind: 'church',
      description: 'Guest ministry invitations, speakers, event coordination and engagement records.'
    }
  ];

  private readonly selectedWorkspaceSubject = new BehaviorSubject<Workspace>(
    this.workspaces.find(workspace => workspace.id === 'apostle-cynthia') ?? this.workspaces[0]
  );

  readonly selectedWorkspace$ = this.selectedWorkspaceSubject.asObservable();

  get selectedWorkspace(): Workspace {
    return this.selectedWorkspaceSubject.value;
  }

  selectWorkspace(workspaceId: WorkspaceId): void {
    const workspace = this.workspaces.find(item => item.id === workspaceId);
    if (!workspace) {
      console.warn(`Workspace "${workspaceId}" was not found.`);
      return;
    }
    this.selectedWorkspaceSubject.next(workspace);
  }
}
