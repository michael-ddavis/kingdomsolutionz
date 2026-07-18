import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import {
  WorkspaceSwitcherComponent
} from './components/workspace-switcher/workspace-switcher.component';
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
  AssignmentCareNetworkComponent
} from './pages/assignments/assignment-care-network/assignment-care-network.component';
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
  CareNetworkInboxComponent
} from './pages/care-network/care-network-inbox.component';
import {
  PlatformDashboardComponent
} from './pages/platform-dashboard/platform-dashboard.component';
import {
  PlatformLoginComponent
} from './pages/platform-login/platform-login.component';
import {
  PartnerReferralResponseComponent
} from './pages/referrals/partner-referral-response/partner-referral-response.component';
import {
  SpeakingRequestDetailComponent
} from './pages/speaking-requests/speaking-request-detail/speaking-request-detail.component';
import {
  SpeakingRequestListComponent
} from './pages/speaking-requests/speaking-request-list/speaking-request-list.component';
import { PlatformRoutingModule } from './platform-routing.module';
import {
  KosDrawerComponent
} from './shared/components/kos-drawer/kos-drawer.component';

@NgModule({
  declarations: [
    AssignmentActivityComponent,
    AssignmentCareNetworkComponent,
    AssignmentContactsComponent,
    AssignmentDetailComponent,
    AssignmentDocumentsComponent,
    AssignmentListComponent,
    AssignmentOverviewComponent,
    AssignmentTravelComponent,
    AssignmentWorkspaceComponent,
    CareNetworkInboxComponent,
    KosDrawerComponent,
    PlatformDashboardComponent,
    PlatformLoginComponent,
    PartnerReferralResponseComponent,
    PlatformShellComponent,
    SpeakingRequestDetailComponent,
    SpeakingRequestListComponent,
    WorkspaceSwitcherComponent
  ],
  imports: [
    CommonModule,
    PlatformRoutingModule,
    ReactiveFormsModule
  ]
})
export class PlatformModule { }
