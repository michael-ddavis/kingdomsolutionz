import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { filter, take } from 'rxjs';

import { Assignment } from '../../../shared/models/assignment.model';
import { AssignmentService } from '../../../shared/services/assignment.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-assignment-closeout',
  templateUrl: './assignment-closeout.component.html',
  styleUrls: ['./assignment-closeout.component.scss']
})
export class AssignmentCloseoutComponent implements OnInit {
  private readonly assignmentId =
    Number(this.route.parent?.snapshot.paramMap.get('id'));

  readonly assignment$ =
    this.assignmentService.getAssignment(this.assignmentId);

  saved = false;

  readonly form = this.formBuilder.nonNullable.group({
    actualAttendance: [0, [Validators.required, Validators.min(1)]],
    ministryOutcomes: ['', Validators.required],
    testimonies: '',
    outstandingExpenses: '',
    honorariumReconciled: false,
    hostFeedback: '',
    thankYouSent: false
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly assignmentService: AssignmentService
  ) {}

  ngOnInit(): void {
    this.assignment$
      .pipe(
        filter((assignment): assignment is Assignment => Boolean(assignment)),
        take(1)
      )
      .subscribe(assignment =>
        this.form.patchValue(assignment.closeout)
      );
  }

  save(assignment: Assignment, close = false): void {
    if (close && !this.canClose) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.assignmentService.updateCloseout(
      assignment.id,
      {
        ...assignment.closeout,
        ...value,
        ministryOutcomes: value.ministryOutcomes.trim(),
        testimonies: value.testimonies.trim(),
        outstandingExpenses: value.outstandingExpenses.trim(),
        hostFeedback: value.hostFeedback.trim()
      },
      close
    );
    this.saved = true;
    window.setTimeout(() => this.saved = false, 2200);
  }

  get canClose(): boolean {
    const value = this.form.getRawValue();
    return this.form.valid &&
      value.honorariumReconciled &&
      value.thankYouSent;
  }
}
