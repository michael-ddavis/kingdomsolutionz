import {
  Component,
  OnDestroy
} from '@angular/core';

import {
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable
} from 'rxjs';

import {
  Assignment,
  AssignmentActivityItem,
  AssignmentActivitySection,
  AssignmentActivityTone
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

@Component({
  standalone: false,
  selector: 'app-assignment-activity',

  templateUrl:
    './assignment-activity.component.html',

  styleUrls: [
    './assignment-activity.component.scss'
  ]
})
export class AssignmentActivityComponent
  implements OnDestroy {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  private savedMessageTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  saved = false;

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  readonly noteForm =
    this.formBuilder.nonNullable.group({
      message:
        this.formBuilder.nonNullable.control(
          '',
          [
            Validators.required,
            Validators.maxLength(500)
          ]
        ),

      tone:
        this.formBuilder.nonNullable
          .control<AssignmentActivityTone>(
            'neutral'
          )
    });

  readonly sectionLabels:
    Record<
      AssignmentActivitySection,
      string
    > = {
      overview: 'Overview',
      checklist: 'Checklist',
      travel: 'Travel',
      contacts: 'Contacts',
      documents: 'Documents',
      responses: 'Responses',
      'follow-up': 'Follow-Up'
    };

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly formBuilder:
      FormBuilder,

    private readonly assignmentService:
      AssignmentService
  ) {}

  ngOnDestroy(): void {
    if (this.savedMessageTimer) {
      clearTimeout(
        this.savedMessageTimer
      );
    }
  }

  addNote(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const value =
      this.noteForm.getRawValue();

    this.assignmentService
      .addActivityNote(
        this.assignmentId,
        value.message,
        value.tone
      );

    this.noteForm.reset({
      message: '',
      tone: 'neutral'
    });

    this.showSavedMessage();
  }

  getSortedActivity(
    assignment: Assignment
  ): AssignmentActivityItem[] {
    return [
      ...assignment.activityLog.items
    ].sort(
      (left, right) =>
        new Date(
          right.createdUtc
        ).getTime() -
        new Date(
          left.createdUtc
        ).getTime()
    );
  }

  getActivitySymbol(
    item: AssignmentActivityItem
  ): string {
    switch (item.type) {
      case 'assignment-created':
        return '✓';

      case 'travel-updated':
        return '✈';

      case 'contacts-updated':
        return '◎';

      case 'document-uploaded':
        return '↑';

      case 'document-removed':
        return '−';

      case 'task-updated':
        return '✓';

      case 'comment-added':
        return '◌';

      case 'note-added':
      default:
        return '•';
    }
  }

  trackByActivityId(
    _index: number,
    item: AssignmentActivityItem
  ): number {
    return item.id;
  }

  private showSavedMessage(): void {
    if (this.savedMessageTimer) {
      clearTimeout(
        this.savedMessageTimer
      );
    }

    this.saved = true;

    this.savedMessageTimer =
      setTimeout(() => {
        this.saved = false;
        this.savedMessageTimer = null;
      }, 2500);
  }
}