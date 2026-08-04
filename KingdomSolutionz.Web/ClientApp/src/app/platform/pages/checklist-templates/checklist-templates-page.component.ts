import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { combineLatest, map } from 'rxjs';

import {
  ChecklistTemplate
} from '../../shared/models/checklist-template.model';
import {
  ChecklistTemplateService
} from '../../shared/services/checklist-template.service';
import {
  WorkspaceService
} from '../../shared/services/workspace.service';

@Component({
  selector: 'app-checklist-templates-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="operations-page">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Kingdom Operations</p>
          <h1>Reusable checklists</h1>
          <p>
            Standardize recurring ministry work without taking ownership
            away from the ministry or specialized KingdomOS module.
          </p>
        </div>
        <button type="button" (click)="composerOpen = !composerOpen">
          {{ composerOpen ? 'Close' : 'New template' }}
        </button>
      </header>

      <form
        *ngIf="composerOpen"
        class="composer"
        [formGroup]="form"
        (ngSubmit)="createTemplate()">
        <label>
          <span>Template name</span>
          <input formControlName="name" />
        </label>
        <label>
          <span>Category</span>
          <select formControlName="category">
            <option value="assignment">Assignment</option>
            <option value="event">Event</option>
            <option value="administration">Administration</option>
            <option value="follow-up">Follow-up</option>
          </select>
        </label>
        <label class="wide">
          <span>Description</span>
          <textarea rows="2" formControlName="description"></textarea>
        </label>
        <label class="wide">
          <span>Tasks — one per line</span>
          <textarea rows="5" formControlName="tasks"></textarea>
        </label>
        <div class="form-actions wide">
          <button type="submit" [disabled]="form.invalid">
            Save reusable template
          </button>
        </div>
      </form>

      <ng-container *ngIf="viewModel$ | async as vm">
        <div class="scope-note">
          Showing templates available to <strong>{{ vm.workspace.name }}</strong>.
        </div>

        <div class="template-grid" *ngIf="vm.templates.length; else emptyState">
          <article
            *ngFor="let template of vm.templates; trackBy: trackById"
            [class.inactive]="!template.active">
            <header>
              <span>{{ getCategoryLabel(template) }}</span>
              <small>{{ template.tasks.length }} tasks</small>
            </header>
            <h2>{{ template.name }}</h2>
            <p>{{ template.description }}</p>
            <ol>
              <li *ngFor="let task of template.tasks.slice(0, 4)">
                <span>{{ task.title }}</span>
                <small>{{ task.defaultOwner }}</small>
              </li>
            </ol>
            <footer>
              <button type="button" (click)="duplicate(template.id)">
                Duplicate
              </button>
              <button
                type="button"
                class="secondary"
                (click)="setActive(template.id, !template.active)">
                {{ template.active ? 'Archive' : 'Restore' }}
              </button>
            </footer>
          </article>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-state">
          <h2>No checklist templates yet</h2>
          <p>Create the first repeatable workflow for this ministry.</p>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .operations-page { display: grid; gap: 1.5rem; padding: 2rem; }
    .page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .page-heading h1 { margin: .2rem 0 .5rem; font-size: clamp(2rem, 4vw, 3.25rem); }
    .page-heading p:not(.eyebrow) { max-width: 48rem; margin: 0; color: #5f6773; }
    .eyebrow { margin: 0; color: #1e5c4a; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    button { border: 0; border-radius: .8rem; padding: .75rem 1rem; background: #183b50; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    button.secondary { background: #edf1f3; color: #263944; }
    .composer { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; border: 1px solid #dce4e7; border-radius: 1rem; background: white; box-shadow: 0 14px 30px rgba(25, 52, 66, .08); }
    label { display: grid; gap: .4rem; font-weight: 700; color: #344853; }
    input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid #bdcbd1; border-radius: .65rem; padding: .7rem .8rem; font: inherit; background: #fff; }
    .wide { grid-column: 1 / -1; }
    .form-actions { display: flex; justify-content: flex-end; }
    .scope-note { padding: .85rem 1rem; border-radius: .8rem; background: #f1f5f2; color: #425a50; }
    .template-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
    article { display: grid; gap: .8rem; padding: 1.15rem; border: 1px solid #dce4e7; border-radius: 1rem; background: white; box-shadow: 0 10px 24px rgba(25, 52, 66, .06); }
    article.inactive { opacity: .65; }
    article header, article footer { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    article header span { color: #775221; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    article h2 { margin: 0; font-size: 1.2rem; }
    article p { margin: 0; color: #64727a; }
    ol { display: grid; gap: .5rem; margin: 0; padding-left: 1.25rem; }
    li { padding-left: .25rem; }
    li span, li small { display: block; }
    li small { color: #75838a; }
    .empty-state { padding: 3rem; border: 1px dashed #bdcbd1; border-radius: 1rem; text-align: center; }
    @media (max-width: 720px) {
      .operations-page { padding: 1rem; }
      .page-heading { flex-direction: column; }
      .composer { grid-template-columns: 1fr; }
      .wide { grid-column: auto; }
    }
  `]
})
export class ChecklistTemplatesPageComponent {
  composerOpen = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['assignment' as ChecklistTemplate['category'], Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    tasks: ['', Validators.required]
  });

  readonly viewModel$ = combineLatest([
    this.workspaceService.selectedWorkspace$,
    this.templates.templates$
  ]).pipe(
    map(([workspace, templates]) => ({
      workspace,
      templates: templates.filter(template =>
        workspace.id === 'all' ||
        template.workspaceId === 'all' ||
        template.workspaceId === workspace.id
      )
    }))
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly templates: ChecklistTemplateService,
    private readonly workspaceService: WorkspaceService
  ) {}

  createTemplate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.templates.create({
      workspaceId: this.workspaceService.selectedWorkspace.id,
      name: value.name,
      description: value.description,
      category: value.category,
      taskTitles: value.tasks.split(/\r?\n/)
    });
    this.form.reset({
      name: '',
      category: 'assignment',
      description: '',
      tasks: ''
    });
    this.composerOpen = false;
  }

  duplicate(templateId: number): void {
    this.templates.duplicate(templateId);
  }

  setActive(templateId: number, active: boolean): void {
    this.templates.setActive(templateId, active);
  }

  getCategoryLabel(template: ChecklistTemplate): string {
    return template.category.replace('-', ' ');
  }

  trackById(_index: number, template: ChecklistTemplate): number {
    return template.id;
  }
}
