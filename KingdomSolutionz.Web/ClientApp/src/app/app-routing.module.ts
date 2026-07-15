import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

import { HomeComponent } from './pages/home/home.component';
import { ServicesComponent } from './pages/services/services.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { StartProjectComponent } from './pages/start-project/start-project.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';

import { PlatformShellComponent } from './platform/layout/platform-shell/platform-shell.component';
import { PlatformLoginComponent } from './platform/pages/platform-login/platform-login.component';
import { PlatformDashboardComponent } from './platform/pages/platform-dashboard/platform-dashboard.component';
import {
  SpeakingRequestListComponent
} from './platform/pages/speaking-requests/speaking-request-list/speaking-request-list.component';

import {
  SpeakingRequestDetailComponent
} from './platform/pages/speaking-requests/speaking-request-detail/speaking-request-detail.component';

import {
  SpeakingRequestFormComponent
} from './platform/pages/speaking-requests/speaking-request-form/speaking-request-form.component';
import {
  AssignmentDetailComponent
} from './platform/pages/assignments/assignment-detail/assignment-detail.component';
import {
  AssignmentListComponent
} from './platform/pages/assignments/assignment-list/assignment-list.component';
import {
  AssignmentWorkspaceComponent
} from './platform/pages/assignments/assignment-workspace/assignment-workspace.component';

import {
  AssignmentOverviewComponent
} from './platform/pages/assignments/assignment-overview/assignment-overview.component';

const routes: Routes = [
  {
    path: 'app/login',
    component: PlatformLoginComponent
  },
  {
    path: 'app',
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
      },
    ]
  },
  {
    path: 'invite/apostle-cynthia',
    component: SpeakingRequestFormComponent
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'services',
        component: ServicesComponent
      },
      {
        path: 'pricing',
        component: PricingComponent
      },
      {
        path: 'portfolio',
        component: PortfolioComponent
      },
      {
        path: 'start-project',
        component: StartProjectComponent
      },
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'contact',
        component: ContactComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }