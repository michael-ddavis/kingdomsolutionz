import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  map,
  of,
  shareReplay
} from 'rxjs';

interface KingdomSession {
  readonly enabledModules?: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class ModuleEntitlementService {
  private readonly enabledModules$ =
    this.http.get<KingdomSession>(
      '/api/kingdomos/session'
    ).pipe(
      map(session => new Set(
        (session.enabledModules ?? [])
          .map(module => module.toLowerCase())
      )),
      catchError(() => of(new Set<string>())),
      shareReplay({
        bufferSize: 1,
        refCount: false
      })
    );

  constructor(private readonly http: HttpClient) { }

  isEnabled(moduleKey: string): Observable<boolean> {
    const normalizedKey = moduleKey
      .trim()
      .toLowerCase();

    return this.enabledModules$.pipe(
      map(modules => modules.has(normalizedKey))
    );
  }
}
