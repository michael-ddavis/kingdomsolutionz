import { Component, HostListener } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Workspace
} from '../../shared/models/workspace.model';

import {
  WorkspaceService
} from '../../shared/services/workspace.service';

export interface PlatformNavigationItem {
  label: string;
  description?: string;
  route: string;
  icon: 'dashboard' | 'requests' | 'assignments';
  exact?: boolean;
}

interface PlatformNavigationSection {
  label: string;
  items: PlatformNavigationItem[];
}

@Component({
  selector: 'app-platform-shell',
  templateUrl: './platform-shell.component.html',
  styleUrls: ['./platform-shell.component.scss']
})
@HostListener(
  'document:keydown.escape'
)
export class PlatformShellComponent {
  sidebarOpen = false;

  readonly selectedWorkspace$:
    Observable<Workspace> =
    this.workspaceService.selectedWorkspace$;

  readonly navigationSections$:
    Observable<PlatformNavigationSection[]> =
    this.selectedWorkspace$.pipe(
      map(workspace =>
        this.buildNavigationSections(workspace)
      )
    );

  constructor(
    private readonly workspaceService:
      WorkspaceService
  ) { }

  onEscape(): void {
    this.closeSidebar();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private buildNavigationSections(
    workspace: Workspace
  ): PlatformNavigationSection[] {
    switch (workspace.id) {
      case 'apostle-cynthia':
        return this.buildApostleCynthiaNavigation();

      case 'jpp':
        return this.buildJppNavigation();

      case 'all':
      default:
        return this.buildAllMinistriesNavigation();
    }
  }

  private buildAllMinistriesNavigation():
    PlatformNavigationSection[] {
    return [
      {
        label: 'Overview',
        items: [
          {
            label: 'Dashboard',
            description:
              'Priorities across connected ministries',
            route: '/app/dashboard',
            icon: 'dashboard',
            exact: true
          }
        ]
      },
      {
        label: 'Apostle Cynthia Ministries',
        items: [
          {
            label: 'Speaking Requests',
            description:
              'Review incoming host invitations',
            route: '/app/speaking-requests',
            icon: 'requests'
          },
          {
            label: 'Assignments',
            description:
              'Approved engagements and preparation',
            route: '/app/assignments',
            icon: 'assignments'
          }
        ]
      }
    ];
  }

  private buildApostleCynthiaNavigation():
    PlatformNavigationSection[] {
    return [
      {
        label: 'Overview',
        items: [
          {
            label: 'Dashboard',
            description:
              'Itinerant ministry overview',
            route: '/app/dashboard',
            icon: 'dashboard',
            exact: true
          }
        ]
      },
      {
        label: 'Speaking Ministry',
        items: [
          {
            label: 'Speaking Requests',
            description:
              'Review incoming invitations',
            route: '/app/speaking-requests',
            icon: 'requests'
          },
          {
            label: 'Assignments',
            description:
              'Travel, preparation and follow-up',
            route: '/app/assignments',
            icon: 'assignments'
          }
        ]
      }
    ];
  }

  private buildJppNavigation():
    PlatformNavigationSection[] {
    return [
      {
        label: 'Overview',
        items: [
          {
            label: 'Dashboard',
            description:
              'Discipleship and care overview',
            route: '/app/dashboard',
            icon: 'dashboard',
            exact: true
          }
        ]
      }
    ];
  }
}