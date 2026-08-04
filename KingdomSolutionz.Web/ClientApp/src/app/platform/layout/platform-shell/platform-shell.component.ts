import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { KingdomNotification } from '../../shared/models/notification.model';
import { Workspace } from '../../shared/models/workspace.model';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { NotificationCenterService } from '../../shared/services/notification-center.service';
import { BrandPalette, BrandPaletteService } from '../../shared/services/brand-palette.service';
import { ModuleEntitlementService } from '../../shared/services/module-entitlement.service';

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
export class PlatformShellComponent implements OnDestroy {
  @ViewChild('mobileMenuButton') mobileMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('sidebar') sidebar?: ElementRef<HTMLElement>;

  sidebarOpen = false;
  notificationCenterOpen = false;
  appearanceOpen = false;
  notificationFilter: 'all' | 'unread' = 'all';
  compactNavigation = this.isCompactNavigation();
  paletteSaved = false;
  savedPalette!: BrandPalette;
  draftPalette!: BrandPalette;
  readonly palettePresets = this.brandPaletteService.presets;

  readonly selectedWorkspace$: Observable<Workspace> =
    this.workspaceService.selectedWorkspace$;

  readonly navigationSections$: Observable<PlatformNavigationSection[]> =
    combineLatest([
      this.selectedWorkspace$,
      this.moduleEntitlements.isEnabled('care')
    ]).pipe(
      map(([_workspace, careEnabled]) => this.buildNavigation(careEnabled))
    );

  readonly notifications$ = this.notificationCenterService.notifications$;
  readonly unreadNotificationCount$ = this.notificationCenterService.unreadCount$;

  private readonly notificationOpenSubscription =
    this.notificationCenterService.openRequests$.subscribe(() => this.openNotificationCenter());

  private readonly workspacePaletteSubscription =
    this.workspaceService.selectedWorkspace$.subscribe(workspace => {
      this.savedPalette = this.brandPaletteService.activate(workspace.id);
      this.draftPalette = { ...this.savedPalette };
    });

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly notificationCenterService: NotificationCenterService,
    private readonly brandPaletteService: BrandPaletteService,
    private readonly moduleEntitlements: ModuleEntitlementService,
    private readonly router: Router
  ) {}

  ngOnDestroy(): void {
    this.notificationOpenSubscription.unsubscribe();
    this.workspacePaletteSubscription.unsubscribe();
    document.body.classList.remove('kos-sidebar-open');
  }

  toggleSidebar(): void {
    this.sidebarOpen ? this.closeSidebar() : this.openSidebar();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
    document.body.classList.add('kos-sidebar-open');
    window.setTimeout(() => this.getFocusableSidebarElements()[0]?.focus());
  }

  closeSidebar(restoreFocus = true): void {
    if (!this.sidebarOpen) return;
    this.sidebarOpen = false;
    document.body.classList.remove('kos-sidebar-open');
    if (restoreFocus && this.compactNavigation) {
      window.setTimeout(() => this.mobileMenuButton?.nativeElement.focus());
    }
  }

  toggleNotificationCenter(): void {
    this.notificationCenterOpen
      ? this.closeNotificationCenter()
      : this.openNotificationCenter();
  }

  openNotificationCenter(): void {
    this.closeAppearance();
    this.closeSidebar(false);
    this.notificationCenterOpen = true;
  }

  closeNotificationCenter(): void {
    this.notificationCenterOpen = false;
  }

  setNotificationFilter(filter: 'all' | 'unread'): void {
    this.notificationFilter = filter;
  }

  getVisibleNotifications(
    notifications: readonly KingdomNotification[]
  ): readonly KingdomNotification[] {
    return this.notificationFilter === 'unread'
      ? notifications.filter(notification => !notification.read)
      : notifications;
  }

  openNotification(notification: KingdomNotification): void {
    this.notificationCenterService.markAsRead(notification.id);
    this.closeNotificationCenter();
    this.router.navigateByUrl(notification.route);
  }

  markAllNotificationsAsRead(notifications: readonly KingdomNotification[]): void {
    this.notificationCenterService.markAllAsRead(notifications);
  }

  getNotificationTime(createdUtc: string): string {
    const timestamp = new Date(createdUtc).getTime();
    if (!Number.isFinite(timestamp)) return '';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  toggleAppearance(): void {
    this.appearanceOpen ? this.closeAppearance() : this.openAppearance();
  }

  openAppearance(): void {
    this.closeNotificationCenter();
    this.closeSidebar(false);
    this.paletteSaved = false;
    this.draftPalette = { ...this.savedPalette };
    this.appearanceOpen = true;
  }

  closeAppearance(): void {
    this.appearanceOpen = false;
    if (this.savedPalette) this.brandPaletteService.preview(this.savedPalette);
  }

  selectPalettePreset(palette: BrandPalette): void {
    this.draftPalette = { ...palette };
    this.brandPaletteService.preview(this.draftPalette);
  }

  savePalette(): void {
    this.savedPalette = this.brandPaletteService.savePreset(this.draftPalette);
    this.draftPalette = { ...this.savedPalette };
    this.paletteSaved = true;
  }

  restoreDefaultPalette(): void {
    this.savedPalette = this.brandPaletteService.reset();
    this.draftPalette = { ...this.savedPalette };
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSidebar();
      this.closeNotificationCenter();
      this.closeAppearance();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const wasCompact = this.compactNavigation;
    this.compactNavigation = this.isCompactNavigation();
    if (wasCompact && !this.compactNavigation && this.sidebarOpen) {
      this.closeSidebar(false);
    }
  }

  private buildNavigation(careEnabled: boolean): PlatformNavigationSection[] {
    const sections: PlatformNavigationSection[] = [
      {
        label: 'Overview',
        items: [
          {
            label: 'Engagement Dashboard',
            description: 'Invitations, readiness and closeout priorities',
            route: '/app/dashboard',
            icon: 'dashboard',
            exact: true
          }
        ]
      },
      {
        label: 'Engagement Management',
        items: [
          {
            label: 'Speaking Requests',
            description: 'Review incoming host invitations',
            route: '/app/speaking-requests',
            icon: 'requests'
          },
          {
            label: 'Engagements',
            description: 'Preparation, travel, hosts and closeout',
            route: '/app/assignments',
            icon: 'assignments'
          },
          {
            label: 'Speaker Profile',
            description: 'Biography, assets, preferences and team contacts',
            route: '/app/speaker-profile',
            icon: 'requests'
          }
        ]
      }
    ];

    if (careEnabled) {
      sections.push({
        label: 'Ministry Follow-through',
        items: [
          {
            label: 'Care Network',
            description: 'Consented responses, referrals and local partners',
            route: '/app/care-network',
            icon: 'care'
          }
        ]
      });
    }

    return sections;
  }

  private getFocusableSidebarElements(): HTMLElement[] {
    if (!this.sidebar) return [];
    return Array.from(
      this.sidebar.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  private isCompactNavigation(): boolean {
    return window.matchMedia('(max-width: 900px)').matches;
  }
}
