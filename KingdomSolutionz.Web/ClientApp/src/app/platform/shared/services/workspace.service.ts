import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  Workspace,
  WorkspaceId
} from '../models/workspace.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  readonly workspaces: readonly Workspace[] = [
    {
      id: 'all',
      name: 'All Ministries',
      shortName: 'All Ministries',
      kind: 'network',
      description:
        'A combined executive view across your connected ministries.'
    },
    {
      id: 'apostle-cynthia',
      name: 'Cynthia Thompson Global Ministries',
      shortName: 'CTG Ministries',
      kind: 'itinerant-ministry',
      description:
        'Speaking engagements, travel, events, ministry responses and handoffs.'
    }
  ];

  private readonly selectedWorkspaceSubject =
    new BehaviorSubject<Workspace>(
      this.workspaces.find(
        workspace =>
          workspace.id === 'apostle-cynthia'
      ) ?? this.workspaces[0]
    );

  readonly selectedWorkspace$ =
    this.selectedWorkspaceSubject.asObservable();

  get selectedWorkspace(): Workspace {
    return this.selectedWorkspaceSubject.value;
  }

  selectWorkspace(workspaceId: WorkspaceId): void {
    const workspace = this.workspaces.find(
      item => item.id === workspaceId
    );

    if (!workspace) {
      console.warn(`Workspace "${workspaceId}" was not found.`);
      return;
    }

    this.selectedWorkspaceSubject.next(workspace);
  }
}
