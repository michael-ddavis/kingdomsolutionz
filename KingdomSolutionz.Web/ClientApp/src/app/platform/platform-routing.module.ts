import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PlatformShellComponent } from './layout/platform-shell/platform-shell.component';
import { AssignmentActivityComponent } from './pages/assignments/assignment-activity/assignment-activity.component';
import { AssignmentContactsComponent } from './pages/assignments/assignment-contacts/assignment-contacts.component';
import { AssignmentCareNetworkComponent } from './pages/assignments/assignment-care-network/assignment-care-network.component';
import { AssignmentCloseoutComponent } from './pages/assignments/assignment-closeout/assignment-closeout.component';
import { AssignmentDetailComponent } from './pages/assignments/assignment-detail/assignment-detail.component';
import { AssignmentDocumentsComponent } from './pages/assignments/assignment-documents/assignment-documents.component';
import { AssignmentListComponent } from './pages/assignments/assignment-list/assignment-list.component';
import { AssignmentOverviewComponent } from './pages/assignments/assignment-overview/assignment-overview.component';
import { AssignmentTravelComponent } from './pages/assignments/assignment-travel/assignment-travel.component';
import { AssignmentWorkspaceComponent } from './pages/assignments/assignment-workspace/assignment-workspace.component';
import { CareNetworkInboxComponent } from './pages/care-network/care-network-inbox.component';
import { PlatformDashboardComponent } from './pages/platform-dashboard/platform-dashboard.component';
import { PlatformLoginComponent } from './pages/platform-login/platform-login.component';
import { PartnerReferralResponseComponent } from './pages/referrals/partner-referral-response/partner-referral-response.component';
import { SpeakingRequestDetailComponent } from './pages/speaking-requests/speaking-request-detail/speaking-request-detail.component';
import { SpeakingRequestListComponent } from './pages/speaking-requests/speaking-request-list/speaking-request-list.component';
import { SpeakerProfileComponent } from './pages/speaker-profile/speaker-profile.component';
import { moduleEntitlementGuard } from './shared/guards/module-entitlement.guard';

const routes: Routes = [
  { path: 'login', component: PlatformLoginComponent },
  {
    path: 'referrals/:id/respond',
    component: PartnerReferralResponseComponent,
    canActivate: [moduleEntitlementGuard],
    data: { module: 'care' }
  },
  {
    path: '',
    component: PlatformShellComponent,
    children: [
      { path: 'dashboard', component: PlatformDashboardComponent },
      { path: 'speaking-requests', component: SpeakingRequestListComponent },
      { path: 'speaking-requests/:id', component: SpeakingRequestDetailComponent },
      { path: 'speaker-profile', component: SpeakerProfileComponent },
      {
        path: 'care-network',
        component: CareNetworkInboxComponent,
        canActivate: [moduleEntitlementGuard],
        data: { module: 'care' }
      },
      {
        path: 'assignments/:id',
        component: AssignmentWorkspaceComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          { path: 'overview', component: AssignmentOverviewComponent },
          { path: 'checklist', component: AssignmentDetailComponent },
          { path: 'travel', component: AssignmentTravelComponent },
          { path: 'contacts', component: AssignmentContactsComponent },
          { path: 'documents', component: AssignmentDocumentsComponent },
          {
            path: 'care-network',
            component: AssignmentCareNetworkComponent,
            canActivate: [moduleEntitlementGuard],
            data: { module: 'care' }
          },
          { path: 'activity', component: AssignmentActivityComponent },
          { path: 'closeout', component: AssignmentCloseoutComponent }
        ]
      },
      { path: 'assignments', component: AssignmentListComponent },
      { path: '', pathMatch: 'full', component: PlatformDashboardComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlatformRoutingModule { }
