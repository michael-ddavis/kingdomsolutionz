import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { ServicesComponent } from './pages/services/services.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { StartProjectComponent } from './pages/start-project/start-project.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { PlatformShellComponent } from './platform/layout/platform-shell/platform-shell.component';
import { PlatformLoginComponent } from './platform/pages/platform-login/platform-login.component';
import { PlatformDashboardComponent } from './platform/pages/platform-dashboard/platform-dashboard.component';
import { WorkspaceSwitcherComponent } from './platform/components/workspace-switcher/workspace-switcher.component';
import { SpeakingRequestListComponent } from './platform/pages/speaking-requests/speaking-request-list/speaking-request-list.component';
import { SpeakingRequestDetailComponent } from './platform/pages/speaking-requests/speaking-request-detail/speaking-request-detail.component';
import { SpeakingRequestFormComponent } from './platform/pages/speaking-requests/speaking-request-form/speaking-request-form.component';
import { AssignmentDetailComponent } from './platform/pages/assignments/assignment-detail/assignment-detail.component';
import {
  AssignmentListComponent
} from './platform/pages/assignments/assignment-list/assignment-list.component';import { AssignmentWorkspaceComponent } from './platform/pages/assignments/assignment-workspace/assignment-workspace.component';
import { AssignmentOverviewComponent } from './platform/pages/assignments/assignment-overview/assignment-overview.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ServicesComponent,
    PricingComponent,
    PortfolioComponent,
    StartProjectComponent,
    AboutComponent,
    ContactComponent,
    PublicLayoutComponent,
    PlatformShellComponent,
    PlatformLoginComponent,
    PlatformDashboardComponent,
    WorkspaceSwitcherComponent,
    SpeakingRequestListComponent,
    SpeakingRequestDetailComponent,
    SpeakingRequestFormComponent,
    AssignmentDetailComponent,
    AssignmentListComponent,
    AssignmentWorkspaceComponent,
    AssignmentOverviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
