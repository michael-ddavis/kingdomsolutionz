import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface PendingOperationsEvent {
  eventId: string;
  eventName: 'AssignmentApproved' | 'ResponseHandoffCreated';
  occurredAtUtc: string;
  correlationId: string;
  classification: 'Internal' | 'Sensitive';
  data: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class KingdomIntegrationService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly storageKey = 'kingdomos-operations-integration-outbox-v1';
  private flushing = false;

  constructor() {
    void this.flush();
  }

  publish(
    eventName: PendingOperationsEvent['eventName'],
    correlationId: string,
    classification: PendingOperationsEvent['classification'],
    data: Record<string, unknown>
  ): void {
    const pending = this.read();
    if (pending.some(item =>
      item.eventName === eventName &&
      item.correlationId === correlationId
    )) {
      void this.flush();
      return;
    }

    pending.push({
      eventId: this.newId(),
      eventName,
      occurredAtUtc: new Date().toISOString(),
      correlationId,
      classification,
      data
    });
    this.write(pending);
    void this.flush();
  }

  async flush(): Promise<void> {
    if (this.flushing || !this.http) return;
    this.flushing = true;
    try {
      for (const event of this.read()) {
        try {
          await firstValueFrom(
            this.http.post('/api/kingdomos/integration/events', event)
          );
          this.write(this.read().filter(item => item.eventId !== event.eventId));
        } catch {
          break;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private read(): PendingOperationsEvent[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(events: PendingOperationsEvent[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(events));
  }

  private newId(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
