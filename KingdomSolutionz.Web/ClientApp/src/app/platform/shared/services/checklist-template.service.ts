import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  ChecklistTemplate,
  CreateChecklistTemplateInput
} from '../models/checklist-template.model';

@Injectable({ providedIn: 'root' })
export class ChecklistTemplateService {
  private readonly storageKey =
    'kingdomos-operations-checklist-templates-v1';

  private readonly templatesSubject =
    new BehaviorSubject<readonly ChecklistTemplate[]>(
      this.loadTemplates()
    );

  readonly templates$ =
    this.templatesSubject.asObservable();

  constructor() {
    this.templatesSubject.subscribe(templates => {
      try {
        window.localStorage.setItem(
          this.storageKey,
          JSON.stringify(templates)
        );
      } catch {
        // The preview remains usable in memory.
      }
    });
  }

  create(input: CreateChecklistTemplateInput): ChecklistTemplate {
    const now = new Date().toISOString();
    const template: ChecklistTemplate = {
      id: this.nextId(),
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      tasks: input.taskTitles
        .map(title => title.trim())
        .filter(Boolean)
        .map((title, index) => ({
          id: index + 1,
          title,
          description: '',
          defaultOwner: 'Ministry coordinator',
          dueOffsetDays: index
        })),
      active: true,
      createdUtc: now,
      updatedUtc: now
    };

    this.templatesSubject.next([
      template,
      ...this.templatesSubject.value
    ]);
    return template;
  }

  duplicate(templateId: number): ChecklistTemplate | null {
    const source = this.templatesSubject.value.find(
      template => template.id === templateId
    );
    if (!source) {
      return null;
    }

    const now = new Date().toISOString();
    const copy: ChecklistTemplate = {
      ...source,
      id: this.nextId(),
      name: `${source.name} copy`,
      tasks: source.tasks.map(task => ({ ...task })),
      createdUtc: now,
      updatedUtc: now
    };
    this.templatesSubject.next([
      copy,
      ...this.templatesSubject.value
    ]);
    return copy;
  }

  setActive(templateId: number, active: boolean): void {
    const updatedUtc = new Date().toISOString();
    this.templatesSubject.next(
      this.templatesSubject.value.map(template =>
        template.id === templateId
          ? { ...template, active, updatedUtc }
          : template
      )
    );
  }

  private nextId(): number {
    return Math.max(
      0,
      ...this.templatesSubject.value.map(template => template.id)
    ) + 1;
  }

  private loadTemplates(): readonly ChecklistTemplate[] {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChecklistTemplate[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fall through to governed seed templates.
    }

    const now = new Date().toISOString();
    return [
      {
        id: 1,
        workspaceId: 'apostle-cynthia',
        name: 'Speaking assignment preparation',
        description:
          'Reusable preparation responsibilities after a speaking invitation is approved.',
        category: 'assignment',
        active: true,
        createdUtc: now,
        updatedUtc: now,
        tasks: [
          {
            id: 1,
            title: 'Confirm ministry objective and audience',
            description: '',
            defaultOwner: 'Ministry coordinator',
            dueOffsetDays: 0
          },
          {
            id: 2,
            title: 'Collect host contacts and event schedule',
            description: '',
            defaultOwner: 'Host coordinator',
            dueOffsetDays: 1
          },
          {
            id: 3,
            title: 'Publish approved documents and ministry assets',
            description: '',
            defaultOwner: 'Operations',
            dueOffsetDays: 2
          }
        ]
      },
      {
        id: 2,
        workspaceId: 'jpp',
        name: 'Church event readiness',
        description:
          'A repeatable event checklist for ministry owners and volunteer leads.',
        category: 'event',
        active: true,
        createdUtc: now,
        updatedUtc: now,
        tasks: [
          {
            id: 1,
            title: 'Confirm ministry owner and serving team',
            description: '',
            defaultOwner: 'Ministry owner',
            dueOffsetDays: 0
          },
          {
            id: 2,
            title: 'Confirm venue, schedule and communications',
            description: '',
            defaultOwner: 'Operations',
            dueOffsetDays: 2
          },
          {
            id: 3,
            title: 'Record outcomes and unresolved follow-up',
            description: '',
            defaultOwner: 'Ministry owner',
            dueOffsetDays: 7
          }
        ]
      },
      {
        id: 3,
        workspaceId: 'all',
        name: 'Monthly ministry operations review',
        description:
          'An oversight checklist for priorities, ownership, blockers and next decisions.',
        category: 'administration',
        active: true,
        createdUtc: now,
        updatedUtc: now,
        tasks: [
          {
            id: 1,
            title: 'Review open work and overdue ownership',
            description: '',
            defaultOwner: 'Operations lead',
            dueOffsetDays: 0
          },
          {
            id: 2,
            title: 'Review support requests and cross-module dependencies',
            description: '',
            defaultOwner: 'Operations lead',
            dueOffsetDays: 0
          },
          {
            id: 3,
            title: 'Publish decisions and next-month priorities',
            description: '',
            defaultOwner: 'Executive owner',
            dueOffsetDays: 1
          }
        ]
      }
    ];
  }
}
