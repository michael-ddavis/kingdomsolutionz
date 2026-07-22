import {
  BehaviorSubject,
  firstValueFrom
} from 'rxjs';

import {
  SEEDED_SPEAKING_REQUESTS
} from '../demo-data/speaking-request.seed';
import { Assignment } from '../models/assignment.model';
import { CareNetworkState } from '../models/care-referral.model';
import { NotificationCenterService } from './notification-center.service';

describe('NotificationCenterService', () => {
  const storageKey =
    'kingdomops-notification-read-state-v1';

  beforeEach(() => {
    window.localStorage.removeItem(storageKey);
  });

  afterEach(() => {
    window.localStorage.removeItem(storageKey);
  });

  it('creates an actionable notification for a speaking invitation', async () => {
    const service = createService();
    const notifications = await firstValueFrom(
      service.notifications$
    );

    expect(notifications.length).toBe(1);
    expect(notifications[0].title).toBe(
      'New speaking invitation'
    );
    expect(notifications[0].route).toBe(
      '/app/speaking-requests/1003'
    );
    expect(notifications[0].read).toBeFalse();
  });

  it('persists read state for a notification', async () => {
    const service = createService();
    const initialNotifications = await firstValueFrom(
      service.notifications$
    );

    service.markAsRead(initialNotifications[0].id);

    const updatedNotifications = await firstValueFrom(
      service.notifications$
    );

    expect(updatedNotifications[0].read).toBeTrue();
    expect(
      JSON.parse(
        window.localStorage.getItem(storageKey) ?? '[]'
      )
    ).toContain(initialNotifications[0].id);
  });

  it('supports legacy assignments without newer host coordination fields', async () => {
    const legacyAssignment = {
      id: 2001,
      eventName: 'Legacy ministry assignment',
      createdUtc: '2026-07-01T12:00:00.000Z',
      hostCoordination: {
        submittedUtc: '2026-07-02T12:00:00.000Z',
        lastSavedUtc: null
      },
      invitation: {
        agreementStatus: 'not-started'
      }
    } as unknown as Assignment;

    const service = createService([
      legacyAssignment
    ]);

    const notifications = await firstValueFrom(
      service.notifications$
    );

    expect(notifications).toEqual([]);
  });

  function createService(
    assignments: readonly Assignment[] = []
  ): NotificationCenterService {
    const assignmentsSubject =
      new BehaviorSubject<readonly Assignment[]>(
        assignments
      );

    const requestsSubject = new BehaviorSubject(
      SEEDED_SPEAKING_REQUESTS
    );

    const careSubject =
      new BehaviorSubject<CareNetworkState>({
        partners: [],
        responses: [],
        referrals: []
      });

    return new NotificationCenterService(
      {
        assignments$:
          assignmentsSubject.asObservable()
      } as never,
      {
        speakingRequests$:
          requestsSubject.asObservable()
      } as never,
      {
        state$: careSubject.asObservable()
      } as never
    );
  }
});
