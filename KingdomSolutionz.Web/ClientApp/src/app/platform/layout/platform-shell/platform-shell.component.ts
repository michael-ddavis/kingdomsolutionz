import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  combineLatest
} from 'rxjs';
import { map } from 'rxjs/operators';

import {
  KingdomNotification
} from '../../shared/models/notification.model';

import {
  Workspace
} from '../../shared/models/workspace.model';

import {
  WorkspaceService
} from '../../shared/services/workspace.service';

import {
  NotificationCenterService
} from '../../shared/services/notification-center.service';
import {
  BrandPalette,
  BrandPaletteService
} from '../../shared/services/brand-palette.service';
import {
  ModuleEntitlementService
} from '../../shared/services/module-entitlement.service';

export interface PlatformNavigationItem {
  label: string;
  description?: string;
  route: string;
  icon: 'dashboard' | 'requests' | 'assignments' | 'care';
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
  notificationCenterOpen = false;
  appearanceOpen = false;
  paletteSaved = false;
  savedPalette!: BrandPalette;
  draftPalette!: BrandPalette;
  readonly palettePresets = this.brandPaletteService.presets;
  notificationFilter: 'all' | 'unread' = 'all';
  compactNavigation = this.isCompactNavigation();

  readonly selectedWorkspace$:
    Observable<Workspace> =
    this.workspaceService.selectedWorkspace$;

  readonly navigationSections$:
    Observable<PlatformNavigationSection[]> =
    combineLatest([
      this.selectedWorkspace$,
      this.moduleEntitlements.isEnabled('care')
    ]).pipe(
      map(([workspace, careEnabled]) =>
        this.buildNavigationSections(
          workspace,
          careEnabled
        )
      )
    );

  readonly notifications$ =
    this.notificationCenterService.notifications$;

  readonly unreadNotificationCount$ =
    this.notificationCenterService.unreadCount$;

  private readonly notificationOpenSubscription =
    this.notificationCenterService.openRequests$.subscribe(
      () => this.openNotificationCenter()
    );

  private readonly workspacePaletteSubscription =
    this.workspaceService.selectedWorkspace$.subscribe(workspace => {
      this.savedPalette = this.brandPaletteService.activate(workspace.id);
      this.draftPalette = { ...this.savedPalette };
    });

  constructor(
    private readonly workspaceService:
      WorkspaceService,

    private readonly notificationCenterService:
      NotificationCenterService,

    private readonly brandPaletteService:
      BrandPaletteService,

    private readonly moduleEntitlements:
      ModuleEntitlementService,

    private readonly router: Router
  ) { }

  ngOnDestroy(): void {
    this.notificationOpenSubscription.unsubscribe();
    this.workspacePaletteSubscription.unsubscribe();

    document.body.classList.remove(
      'kos-sidebar-open'
    );
  }

  openAppearance(): void {
    this.closeNotificationCenter();
    this.closeSidebar(false);
    this.paletteSaved = false;
    this.draftPalette = { ...this.savedPalette };
    this.appearanceOpen = true;
  }

  toggleAppearance(): void {
    if (this.appearanceOpen) {
      this.closeAppearance();
      return;
    }

    this.openAppearance();
  }

  closeAppearance(): void {
    this.appearanceOpen = false;
    this.brandPaletteService.preview(this.savedPalette);
  }

  selectPalettePreset(palette: BrandPalette): void {
    this.paletteSaved = false;
    this.draftPalette = { ...palette };
    this.brandPaletteService.preview(this.draftPalette);
  }

  updatePaletteColor(field: 'primary' | 'secondary' | 'accent' | 'sidebar' | 'page', value: string): void {
    this.paletteSaved = false;
    this.draftPalette = { ...this.draftPalette, id: 'custom', name: 'Custom palette', [field]: value };
    this.brandPaletteService.preview(this.draftPalette);
  }

  savePalette(): void {
    this.savedPalette = this.draftPalette.id === 'custom'
      ? this.brandPaletteService.save(this.draftPalette)
      : this.brandPaletteService.savePreset(this.draftPalette);
    this.draftPalette = { ...this.savedPalette };
    this.paletteSaved = true;
  }

  restoreDefaultPalette(): void {
    this.savedPalette = this.brandPaletteService.reset();
    this.draftPalette = { ...this.savedPalette };
    this.paletteSaved = false;
  }

  openNotificationCenter(): void {
    this.closeAppearance();

    if (this.sidebarOpen) {
      this.closeSidebar(false);
    }

    this.notificationCenterOpen = true;
  }

  toggleNotificationCenter(): void {
    if (this.notificationCenterOpen) {
      this.closeNotificationCenter();
      return;
    }

    this.openNotificationCenter();
  }

  closeNotificationCenter(): void {
    this.notificationCenterOpen = false;
  }

  setNotificationFilter(
    filter: 'all' | 'unread'
  ): void {
    this.notificationFilter = filter;
  }

  getVisibleNotifications(
    notifications: readonly KingdomNotification[]
  ): readonly KingdomNotification[] {
    if (this.notificationFilter === 'unread') {
      return notifications.filter(
        notification => !notification.read
      );
    }

    return notifications;
  }

  openNotification(
    notification: KingdomNotification
  ): void {
    this.notificationCenterService.markAsRead(
      notification.id
    );
    this.closeNotificationCenter();
    this.router.navigateByUrl(notification.route);
  }

  markAllNotificationsAsRead(
    notifications: readonly KingdomNotification[]
  ): void {
    this.notificationCenterService.markAllAsRead(
      notifications
    );
  }

  getNotificationTime(createdUtc: string): string {
    const timestamp = new Date(createdUtc).getTime();

    if (!Number.isFinite(timestamp)) {
      return '';
    }

    const elapsedMinutes = Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) / 60_000
      )
    );

    if (elapsedMinutes < 1) {
      return 'Just now';
    }

    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(
      elapsedMinutes / 60
    );

    if (elapsedHours < 24) {
      return `${elapsedHours}h ago`;
    }

    const elapsedDays = Math.floor(
      elapsedHours / 24
    );

    if (elapsedDays < 7) {
      return `${elapsedDays}d ago`;
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    ).format(new Date(createdUtc));
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
    workspace: Workspace,
    careEnabled: boolean
  ): PlatformNavigationSection[] {
    switch (workspace.id) {
      case 'apostle-cynthia':
        return this.buildApostleCynthiaNavigation(
          careEnabled
        );

      case 'jpp':
        return this.buildJppNavigation(
          careEnabled
        );

      case 'all':
      default:
        return this.buildAllMinistriesNavigation(
          careEnabled
        );
    }
  }

  private buildAllMinistriesNavigation(
    careEnabled: boolean
  ): PlatformNavigationSection[] {
    const sections: PlatformNavigationSection[] = [
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

    if (careEnabled) {
      sections.push({
        label: 'KingdomOps Care Network',
        items: [
          {
            label: 'Care Inbox',
            description:
              'Responses, referrals and local partners',
            route: '/app/care-network',
            icon: 'care'
          }
        ]
      });
    }

    return sections;
  }

  private buildApostleCynthiaNavigation(
    careEnabled: boolean
  ): PlatformNavigationSection[] {
    const speakingItems: PlatformNavigationItem[] = [
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
          'Preparation, coordination and follow-up',
        route: '/app/assignments',
        icon: 'assignments'
      }
    ];

    if (careEnabled) {
      speakingItems.push({
        label: 'Care Network',
        description:
          'Cross-assignment follow-up inbox',
        route: '/app/care-network',
        icon: 'care'
      });
    }

    speakingItems.push({
      label: 'Speaker Profile',
      description:
        'Approved bio, assets and preferences',
      route: '/app/speaker-profile',
      icon: 'requests'
    });

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
        items: speakingItems
      }
    ];
  }

  private buildJppNavigation(
    careEnabled: boolean
  ): PlatformNavigationSection[] {
    const sections: PlatformNavigationSection[] = [
      {
        label: 'Overview',
        items: [
          {
            label: 'Dashboard',
            description:
              careEnabled
                ? 'Discipleship and care overview'
                : 'Discipleship ministry overview',
            route: '/app/dashboard',
            icon: 'dashboard',
            exact: true
          }
        ]
      }
    ];

    if (careEnabled) {
      sections.push({
        label: 'Care Ministry',
        items: [
          {
            label: 'Care Network',
            description:
              'Responses, referrals and connections',
            route: '/app/care-network',
            icon: 'care'
          }
        ]
      });
    }

    return sections;
  }
}
