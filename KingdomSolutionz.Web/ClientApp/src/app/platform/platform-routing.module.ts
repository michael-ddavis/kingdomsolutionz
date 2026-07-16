import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  PlatformShellComponent
} from './layout/platform-shell/platform-shell.component';
import {
  AssignmentActivityComponent
} from './pages/assignments/assignment-activity/assignment-activity.component';
import {
  AssignmentContactsComponent
} from './pages/assignments/assignment-contacts/assignment-contacts.component';
import {
  AssignmentDetailComponent
} from './pages/assignments/assignment-detail/assignment-detail.component';
import {
  AssignmentDocumentsComponent
} from './pages/assignments/assignment-documents/assignment-documents.component';
import {
  AssignmentListComponent
} from './pages/assignments/assignment-list/assignment-list.component';
import {
  AssignmentOverviewComponent
} from './pages/assignments/assignment-overview/assignment-overview.component';
import {
  AssignmentTravelComponent
} from './pages/assignments/assignment-travel/assignment-travel.component';
import {
  AssignmentWorkspaceComponent
} from './pages/assignments/assignment-workspace/assignment-workspace.component';
import {
  PlatformDashboardComponent
} from './pages/platform-dashboard/platform-dashboard.component';
import {
  PlatformLoginComponent
} from './pages/platform-login/platform-login.component';
import {
  SpeakingRequestDetailComponent
} from './pages/speaking-requests/speaking-request-detail/speaking-request-detail.component';
import {
  SpeakingRequestListComponent
} from './pages/speaking-requests/speaking-request-list/speaking-request-list.component';

const routes: Routes = [
  {
    path: 'login',
    component: PlatformLoginComponent
  },
  {
    path: '',
    component: PlatformShellComponent,
    children: [
      {
        path: 'dashboard',
        component: PlatformDashboardComponent
      },
      {
        path: 'speaking-requests',
        component: SpeakingRequestListComponent
      },
      {
        path: 'speaking-requests/:id',
        component: SpeakingRequestDetailComponent
      },
      {
        path: 'assignments/:id',
        component: AssignmentWorkspaceComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'overview'
          },
          {
            path: 'overview',
            component: AssignmentOverviewComponent
          },
          {
            path: 'checklist',
            component: AssignmentDetailComponent
          },
          {
            path: 'travel',
            component: AssignmentTravelComponent
          },
          {
            path: 'contacts',
            component: AssignmentContactsComponent
          },
          {
            path: 'documents',
            component: AssignmentDocumentsComponent
          },
          {
            path: 'activity',
            component: AssignmentActivityComponent
          }
        ]
      },
      {
        path: 'assignments',
        component: AssignmentListComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlatformRoutingModule { }
