import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

const routes: Routes = [
  {
    path: 'app',
    loadChildren: () =>
      import('./platform/platform.module')
        .then(module => module.PlatformModule)
  },
  {
    path: 'respond/assignments/:id',
    loadComponent: () =>
      import(
        './platform/pages/assignments/assignment-ministry-response/assignment-ministry-response.component'
      ).then(module =>
        module.AssignmentMinistryResponseComponent
      )
  },
  {
    path: 'coordinate/assignments/:id',
    loadComponent: () =>
      import(
        './platform/pages/assignments/assignment-host-coordination/assignment-host-coordination.component'
      ).then(module =>
        module.AssignmentHostCoordinationComponent
      )
  },
  {
    path: 'invite/apostle-cynthia/requests/:id/update',
    loadComponent: () =>
      import(
        './platform/pages/speaking-requests/speaking-request-host-response/speaking-request-host-response.component'
      ).then(module =>
        module.SpeakingRequestHostResponseComponent
      )
  },
  {
    path: 'invite/apostle-cynthia',
    loadComponent: () =>
      import(
        './platform/pages/speaking-requests/speaking-request-form/speaking-request-form.component'
      ).then(module =>
        module.SpeakingRequestFormComponent
      )
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component')
            .then(module => module.HomeComponent)
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/services/services.component')
            .then(module => module.ServicesComponent)
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./pages/pricing/pricing.component')
            .then(module => module.PricingComponent)
      },
      {
        path: 'portfolio',
        loadComponent: () =>
          import('./pages/portfolio/portfolio.component')
            .then(module => module.PortfolioComponent)
      },
      {
        path: 'start-project',
        loadComponent: () =>
          import(
            './pages/start-project/start-project.component'
          ).then(module =>
            module.StartProjectComponent
          )
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about.component')
            .then(module => module.AboutComponent)
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component')
            .then(module => module.ContactComponent)
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
