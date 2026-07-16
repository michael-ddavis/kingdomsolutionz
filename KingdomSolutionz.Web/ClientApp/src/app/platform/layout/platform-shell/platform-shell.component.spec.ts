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
});
