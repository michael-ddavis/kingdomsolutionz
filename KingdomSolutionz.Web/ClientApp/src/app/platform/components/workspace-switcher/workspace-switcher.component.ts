import { Component } from '@angular/core';

import { WorkspaceId } from '../../shared/models/workspace.model';
import { WorkspaceService } from '../../shared/services/workspace.service';

@Component({
  selector: 'app-workspace-switcher',
  templateUrl: './workspace-switcher.component.html',
  styleUrls: ['./workspace-switcher.component.scss']
})
export class WorkspaceSwitcherComponent {
  readonly workspaces = this.workspaceService.workspaces;
  readonly selectedWorkspace$ =
    this.workspaceService.selectedWorkspace$;

  constructor(
    private readonly workspaceService: WorkspaceService
  ) {}

  onWorkspaceChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;

    this.workspaceService.selectWorkspace(
      selectElement.value as WorkspaceId
    );
  }
}