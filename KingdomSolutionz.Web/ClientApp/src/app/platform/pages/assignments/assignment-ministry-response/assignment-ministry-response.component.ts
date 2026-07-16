import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AssignmentService } from '../../../shared/services/assignment.service';
import { CareReferralService } from '../../../shared/services/care-referral.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-assignment-ministry-response',
  templateUrl: './assignment-ministry-response.component.html',
  styleUrls: ['./assignment-ministry-response.component.scss']
})
export class AssignmentMinistryResponseComponent {
  private readonly assignmentId =
    Number(this.route.snapshot.paramMap.get('id'));

  readonly assignment$ =
    this.assignmentService.getAssignment(this.assignmentId);

  submitted = false;
  reference = '';

  readonly form = this.formBuilder.nonNullable.group({
    personName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    preferredContactMethod:
      this.formBuilder.nonNullable.control<'email' | 'phone' | 'text'>('text'),
    city: ['', Validators.required],
    state: '',
    postalCode: '',
    responseType: ['Discipleship', Validators.required],
    requestedSupport: ['', Validators.required],
    consentToShare: [false, Validators.requiredTrue]
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly assignmentService: AssignmentService,
    private readonly careReferralService: CareReferralService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const response = this.careReferralService.addMinistryResponse({
      ...value,
      assignmentId: this.assignmentId,
      personName: value.personName.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      city: value.city.trim(),
      state: value.state.trim(),
      postalCode: value.postalCode.trim(),
      requestedSupport: value.requestedSupport.trim()
    });

    this.reference = `CARE-${response.id}`;
    this.submitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
