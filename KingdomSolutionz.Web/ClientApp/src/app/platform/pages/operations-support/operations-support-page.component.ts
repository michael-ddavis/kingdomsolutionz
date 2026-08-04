import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { combineLatest, map } from 'rxjs';

import {
  OperationsSupportRequest,
  OperationsSupportStatus
} from '../../shared/models/operations-support.model';
import {
  OperationsSupportService
} from '../../shared/services/operations-support.service';
import {
  WorkspaceService
} from '../../shared/services/workspace.service';

@Component({
  selector: 'app-operations-support-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="operations-page">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Kingdom Operations</p>
          <h1>Operations support</h1>
          <p>
            Ask for access, workflow, data, or training help without
            turning Operations into the system of record for another module.
          </p>
        </div>
        <button type="button" (click)="composerOpen = !composerOpen">
          {{ composerOpen ? 'Close' : 'New request' }}
        </button>
      </header>

      <form
        *ngIf="composerOpen"
        class="composer"
        [formGroup]="form"
        (ngSubmit)="createRequest()">
        <label class="wide">
          <span>What do you need help with?</span>
          <input formControlName="title" />
        </label>
        <label>
          <span>Category</span>
          <select formControlName="category">
            <option value="access">Access</option>
            <option value="workflow">Workflow</option>
            <option value="data">Data</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select formControlName="priority">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label class="wide">
          <span>Details</span>
          <textarea rows="4" formControlName="detail"></textarea>
        </label>
        <div class="form-actions wide">
          <button type="submit" [disabled]="form.invalid">
            Send to Operations
          </button>
        </div>
      </form>

      <ng-container *ngIf="viewModel$ | async as vm">
        <section class="queue-summary" aria-label="Support request summary">
          <article>
            <strong>{{ vm.open }}</strong>
            <span>Open requests</span>
          </article>
          <article>
            <strong>{{ vm.urgent }}</strong>
            <span>Urgent or high</span>
          </article>
          <article>
            <strong>{{ vm.resolved }}</strong>
            <span>Resolved</span>
          </article>
        </section>

        <div class="scope-note">
          Showing requests for <strong>{{ vm.workspace.name }}</strong>.
        </div>

        <div class="request-list" *ngIf="vm.requests.length; else emptyState">
          <article
            *ngFor="let request of vm.requests; trackBy: trackById"
            [attr.data-priority]="request.priority">
            <header>
              <div>
                <span>{{ getCategoryLabel(request) }}</span>
                <h2>{{ request.title }}</h2>
              </div>
              <strong class="status">{{ getStatusLabel(request.status) }}</strong>
            </header>
            <p>{{ request.detail }}</p>
            <dl>
              <div><dt>Requested by</dt><dd>{{ request.requestedBy }}</dd></div>
              <div><dt>Owner</dt><dd>{{ request.owner }}</dd></div>
              <div><dt>Priority</dt><dd>{{ request.priority | titlecase }}</dd></div>
              <div><dt>Updated</dt><dd>{{ request.updatedUtc | date:'MMM d, h:mm a' }}</dd></div>
            </dl>
            <footer *ngIf="request.status !== 'resolved'">
              <button
                type="button"
                class="secondary"
                *ngIf="request.status === 'new'"
                (click)="setStatus(request.id, 'in-progress')">
                Start work
              </button>
              <button
                type="button"
                class="secondary"
                (click)="setStatus(request.id, 'waiting')">
                Waiting on ministry
              </button>
              <button
                type="button"
                (click)="setStatus(request.id, 'resolved')">
                Resolve
              </button>
            </footer>
          </article>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-state">
          <h2>No support requests</h2>
          <p>This ministry does not have anything waiting on Operations.</p>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .operations-page { display: grid; gap: 1.5rem; padding: 2rem; }
    .page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .page-heading h1 { margin: .2rem 0 .5rem; font-size: clamp(2rem, 4vw, 3.25rem); }
    .page-heading p:not(.eyebrow) { max-width: 50rem; margin: 0; color: #5f6773; }
    .eyebrow { margin: 0; color: #1e5c4a; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    button { border: 0; border-radius: .8rem; padding: .75rem 1rem; background: #183b50; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    button.secondary { background: #edf1f3; color: #263944; }
    .composer { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid #dce4e7; border-radius: 1rem; background: white; box-shadow: 0 14px 30px rgba(25, 52, 66, .08); }
    label { display: grid; gap: .4rem; font-weight: 700; color: #344853; }
    input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid #bdcbd1; border-radius: .65rem; padding: .7rem .8rem; font: inherit; background: #fff; }
    .wide { grid-column: 1 / -1; }
    .form-actions { display: flex; justify-content: flex-end; }
    .queue-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .queue-summary article { display: grid; gap: .2rem; padding: 1rem; border-radius: 1rem; background: #f1f5f2; }
    .queue-summary strong { font-size: 1.8rem; color: #183b50; }
    .scope-note { padding: .85rem 1rem; border-radius: .8rem; background: #f7f4ec; color: #66583c; }
    .request-list { display: grid; gap: 1rem; }
    .request-list > article { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid #dce4e7; border-left: .35rem solid #8098a4; border-radius: 1rem; background: white; box-shadow: 0 10px 24px rgba(25, 52, 66, .06); }
    .request-list > article[data-priority='high'] { border-left-color: #b97825; }
    .request-list > article[data-priority='urgent'] { border-left-color: #a13f3f; }
    .request-list header, .request-list footer { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
    .request-list header span { color: #775221; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .request-list h2 { margin: .2rem 0 0; font-size: 1.2rem; }
    .request-list p { margin: 0; color: #64727a; }
    .status { padding: .35rem .6rem; border-radius: 999px; background: #edf1f3; color: #344853; font-size: .75rem; white-space: nowrap; }
    dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 0; }
    dl div { display: grid; gap: .2rem; }
    dt { color: #76858d; font-size: .75rem; text-transform: uppercase; }
    dd { margin: 0; color: #314651; font-weight: 700; }
    footer { justify-content: flex-end !important; }
    .empty-state { padding: 3rem; border: 1px dashed #bdcbd1; border-radius: 1rem; text-align: center; }
    @media (max-width: 760px) {
      .operations-page { padding: 1rem; }
      .page-heading { flex-direction: column; }
      .composer, .queue-summary, dl { grid-template-columns: 1fr; }
      .wide { grid-column: auto; }
      .request-list header, .request-list footer { flex-wrap: wrap; }
    }
  `]
})
export class OperationsSupportPageComponent {
  composerOpen = false;

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(140)]],
    category: ['workflow' as const, Validators.required],
    priority: ['normal' as const, Validators.required],
    detail: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  readonly viewModel$ = combineLatest([
    this.workspaceService.selectedWorkspace$,
    this.support.requests$
  ]).pipe(
    map(([workspace, requests]) => {
      const scoped = requests.filter(request =>
        workspace.id === 'all' ||
        request.workspaceId === workspace.id
      );
      return {
        workspace,
        requests: scoped,
        open: scoped.filter(request => request.status !== 'resolved').length,
        urgent: scoped.filter(request =>
          request.status !== 'resolved' &&
          ['high', 'urgent'].includes(request.priority)
        ).length,
        resolved: scoped.filter(request => request.status === 'resolved').length
      };
    })
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly support: OperationsSupportService,
    private readonly workspaceService: WorkspaceService
  ) {}

  createRequest(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.support.create({
      workspaceId: this.workspaceService.selectedWorkspace.id,
      title: value.title,
      detail: value.detail,
      category: value.category,
      priority: value.priority
    });
    this.form.reset({
      title: '',
      category: 'workflow',
      priority: 'normal',
      detail: ''
    });
    this.composerOpen = false;
  }

  setStatus(
    requestId: number,
    status: OperationsSupportStatus
  ): void {
    this.support.updateStatus(requestId, status);
  }

  getCategoryLabel(request: OperationsSupportRequest): string {
    return request.category;
  }

  getStatusLabel(status: OperationsSupportStatus): string {
    return status.replace('-', ' ');
  }

  trackById(_index: number, request: OperationsSupportRequest): number {
    return request.id;
  }
}
