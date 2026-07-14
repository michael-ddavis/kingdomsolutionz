import { Component } from '@angular/core';

import { WorkspaceService } from '../../shared/services/workspace.service';

@Component({
  selector: 'app-platform-shell',
  templateUrl: './platform-shell.component.html',
  styleUrls: ['./platform-shell.component.scss']
})
export class PlatformShellComponent {
  readonly selectedWorkspace$ =
    this.workspaceService.selectedWorkspace$;

  constructor(
    private readonly workspaceService: WorkspaceService
  ) {}
}