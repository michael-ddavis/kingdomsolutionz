import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
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
  standalone: false,
  selector: 'app-platform-shell',
  templateUrl: './platform-shell.component.html',
  styleUrls: ['./platform-shell.component.scss']
})
export class PlatformShellComponent
  implements OnDestroy {
  @ViewChild('mobileMenuButton')
  mobileMenuButton?: ElementRef<HTMLButtonElement>;

  @ViewChild('sidebar')
  sidebar?: ElementRef<HTMLElement>;

  sidebarOpen = false;
  compactNavigation = this.isCompactNavigation();

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

  ngOnDestroy(): void {
    document.body.classList.remove(
      'kos-sidebar-open'
    );
  }

  toggleSidebar(): void {
    if (this.sidebarOpen) {
      this.closeSidebar();
      return;
    }

    this.openSidebar();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
    document.body.classList.add(
      'kos-sidebar-open'
    );

    window.setTimeout(() => {
      this.getFocusableSidebarElements()[0]
        ?.focus();
    });
  }

  closeSidebar(
    restoreFocus = true
  ): void {
    if (!this.sidebarOpen) {
      return;
    }

    this.sidebarOpen = false;
    document.body.classList.remove(
      'kos-sidebar-open'
    );

    if (restoreFocus && this.compactNavigation) {
      window.setTimeout(() => {
        this.mobileMenuButton
          ?.nativeElement
          .focus();
      });
    }
  }

  @HostListener(
    'document:keydown',
    ['$event']
  )
  onDocumentKeydown(
    event: KeyboardEvent
  ): void {
    if (!this.sidebarOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSidebar();
      return;
    }

    if (event.key === 'Tab') {
      this.trapSidebarFocus(event);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const wasCompact =
      this.compactNavigation;

    this.compactNavigation =
      this.isCompactNavigation();

    if (
      wasCompact &&
      !this.compactNavigation &&
      this.sidebarOpen
    ) {
      this.closeSidebar(false);
    }
  }

  private trapSidebarFocus(
    event: KeyboardEvent
  ): void {
    const focusableElements =
      this.getFocusableSidebarElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement =
      focusableElements[0];

    const lastElement =
      focusableElements[
        focusableElements.length - 1
      ];

    const activeElement =
      document.activeElement;

    if (
      event.shiftKey &&
      activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private getFocusableSidebarElements():
    HTMLElement[] {
    if (!this.sidebar) {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(
      this.sidebar.nativeElement
        .querySelectorAll<HTMLElement>(selector)
    ).filter(element =>
      element.getAttribute('aria-hidden') !== 'true'
    );
  }

  private isCompactNavigation(): boolean {
    return window.matchMedia(
      '(max-width: 900px)'
    ).matches;
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
        label: 'Cynthia Thompson Global',
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
          },
          {
            label: 'Speaker Profile',
            description:
              'Approved bio, assets and preferences',
            route: '/app/speaker-profile',
            icon: 'requests'
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
          },
          {
            label: 'Speaker Profile',
            description:
              'Approved bio, assets and preferences',
            route: '/app/speaker-profile',
            icon: 'requests'
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
