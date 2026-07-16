import {
  Component,
  ElementRef,
  HostListener
} from '@angular/core';

import { WorkspaceId } from '../../shared/models/workspace.model';
import { WorkspaceService } from '../../shared/services/workspace.service';

@Component({
  standalone: false,
  selector: 'app-workspace-switcher',
  templateUrl: './workspace-switcher.component.html',
  styleUrls: ['./workspace-switcher.component.scss']
})
export class WorkspaceSwitcherComponent {
  readonly workspaces = this.workspaceService.workspaces;
  readonly selectedWorkspace$ =
    this.workspaceService.selectedWorkspace$;

  menuOpen = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  selectWorkspace(workspaceId: WorkspaceId): void {
    this.workspaceService.selectWorkspace(
      workspaceId
    );

    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event): void {
    if (
      this.menuOpen &&
      !this.elementRef.nativeElement.contains(event.target as Node)
    ) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.menuOpen = false;
  }
}
