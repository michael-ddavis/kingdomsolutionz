import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { map } from 'rxjs';

import {
  ModuleEntitlementService
} from '../services/module-entitlement.service';

export const moduleEntitlementGuard:
  CanActivateFn = route => {
    const router = inject(Router);
    const entitlements = inject(
      ModuleEntitlementService
    );
    const moduleKey = String(
      route.data['module'] ?? ''
    );

    return entitlements.isEnabled(moduleKey).pipe(
      map(enabled => enabled
        ? true
        : router.createUrlTree(['/app/dashboard'])
      )
    );
  };
