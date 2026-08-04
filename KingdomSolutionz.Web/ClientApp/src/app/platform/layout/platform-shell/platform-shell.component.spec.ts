import {
  NO_ERRORS_SCHEMA
} from '@angular/core';
import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  RouterTestingModule
} from '@angular/router/testing';
import { of } from 'rxjs';

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
  ModuleEntitlementService
} from '../../shared/services/module-entitlement.service';
import {
  PlatformShellComponent
} from './platform-shell.component';

describe('PlatformShellComponent', () => {
  let component: PlatformShellComponent;
  let fixture:
    ComponentFixture<PlatformShellComponent>;

  const workspace: Workspace = {
    id: 'apostle-cynthia',
    name: 'Cynthia Thompson Global',
    shortName: 'CTG',
    kind: 'itinerant-ministry',
    description: 'Test workspace'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [PlatformShellComponent],
      providers: [
        {
          provide: WorkspaceService,
          useValue: {
            selectedWorkspace$: of(workspace)
          }
        },
        {
          provide: NotificationCenterService,
          useValue: {
            notifications$: of([]),
            unreadCount$: of(0),
            openRequests$: of(),
            requestOpen: jasmine.createSpy(
              'requestOpen'
            ),
            markAsRead: jasmine.createSpy(
              'markAsRead'
            ),
            markAllAsRead: jasmine.createSpy(
              'markAllAsRead'
            )
          }
        },
        {
          provide: ModuleEntitlementService,
          useValue: {
            isEnabled: () => of(false)
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(
      PlatformShellComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.classList.remove(
      'kos-sidebar-open'
    );
  });

  it('renders an icon for the Assignments link', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.navigation-link'
      ) as NodeListOf<HTMLElement>
    );

    const assignmentsLink = links.find(link =>
      link.textContent?.includes('Assignments')
    );

    expect(assignmentsLink).toBeDefined();
    expect(
      assignmentsLink?.querySelector(
        '.navigation-icon svg'
      )
    ).not.toBeNull();
  });

  it('hides Care navigation when Care is not entitled', () => {
    expect(
      fixture.nativeElement.textContent
    ).not.toContain('Care Network');
  });

  it('closes the mobile navigation with Escape', () => {
    component.openSidebar();

    component.onDocumentKeydown(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        cancelable: true
      })
    );

    expect(component.sidebarOpen).toBeFalse();
    expect(
      document.body.classList.contains(
        'kos-sidebar-open'
      )
    ).toBeFalse();
  });

  it('keeps the right-side drawers mutually exclusive', () => {
    component.openAppearance();

    expect(component.appearanceOpen).toBeTrue();
    expect(component.notificationCenterOpen).toBeFalse();

    component.openNotificationCenter();

    expect(component.appearanceOpen).toBeFalse();
    expect(component.notificationCenterOpen).toBeTrue();
  });

  it('toggles an open right-side drawer closed', () => {
    component.toggleNotificationCenter();
    component.toggleNotificationCenter();

    expect(component.notificationCenterOpen).toBeFalse();
  });
});
