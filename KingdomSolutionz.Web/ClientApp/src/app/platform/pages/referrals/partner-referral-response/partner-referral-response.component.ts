import {
  Component,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  Observable,
  map,
  of,
  switchMap,
  take
} from 'rxjs';

import {
  Assignment
} from '../../../shared/models/assignment.model';

import {
  CareReferralContext,
  CareReferralStatus
} from '../../../shared/models/care-referral.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

import {
  CareReferralService
} from '../../../shared/services/care-referral.service';

interface PartnerReferralViewModel {
  context: CareReferralContext;
  assignment: Assignment;
}

@Component({
  standalone: false,
  selector: 'app-partner-referral-response',
  templateUrl:
    './partner-referral-response.component.html',
  styleUrls: [
    './partner-referral-response.component.scss'
  ]
})
export class PartnerReferralResponseComponent
  implements OnInit {
  private readonly referralId =
    Number(
      this.route.snapshot.paramMap.get('id')
    );

  declineMode = false;
  connectionNote = '';
  releaseReason = '';

  readonly responseForm =
    this.formBuilder.nonNullable.group({
      assignedOwner:
        this.formBuilder.nonNullable.control(
          '',
          [
            Validators.required,
            Validators.maxLength(120)
          ]
        ),
      nextStep:
        this.formBuilder.nonNullable.control(
          'Connections call and Foundations Group introduction',
          [
            Validators.required,
            Validators.maxLength(180)
          ]
        ),
      declineReason:
        this.formBuilder.nonNullable.control(
          '',
          Validators.maxLength(240)
        )
    });

  readonly viewModel$:
    Observable<PartnerReferralViewModel | undefined> =
    this.careReferralService
      .getReferralContext(
        this.referralId
      )
      .pipe(
        switchMap(context => {
          if (!context) {
            return of(undefined);
          }

          return this.assignmentService
            .getAssignment(
              context.referral.assignmentId
            )
            .pipe(
              map(assignment => {
                if (!assignment) {
                  return undefined;
                }

                return {
                  context,
                  assignment
                };
              })
            );
        })
      );

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly formBuilder:
      FormBuilder,

    private readonly assignmentService:
      AssignmentService,

    private readonly careReferralService:
      CareReferralService
  ) {}

  ngOnInit(): void {
    this.careReferralService
      .markViewed(this.referralId);

    this.careReferralService
      .getReferralContext(
        this.referralId
      )
      .pipe(take(1))
      .subscribe(context => {
        if (!context) {
          return;
        }

        this.responseForm.controls
          .assignedOwner
          .setValue(
            context.partner.contactName
          );
      });
  }

  acceptReferral(): void {
    const ownerControl =
      this.responseForm.controls
        .assignedOwner;

    const nextStepControl =
      this.responseForm.controls
        .nextStep;

    ownerControl.markAsTouched();
    nextStepControl.markAsTouched();

    if (
      ownerControl.invalid ||
      nextStepControl.invalid
    ) {
      return;
    }

    this.careReferralService
      .acceptReferral(
        this.referralId,
        ownerControl.value,
        nextStepControl.value
      );

    this.declineMode = false;
  }

  declineReferral(): void {
    const reasonControl =
      this.responseForm.controls
        .declineReason;

    if (!this.declineMode) {
      this.declineMode = true;
      return;
    }

    if (!reasonControl.value.trim()) {
      reasonControl.setErrors({
        required: true
      });
      reasonControl.markAsTouched();
      return;
    }

    this.careReferralService
      .declineReferral(
        this.referralId,
        reasonControl.value
      );

    this.declineMode = false;
  }

  returnToAssignment(
    assignmentId: number
  ): void {
    this.router.navigate([
      '/app/assignments',
      assignmentId,
      'care-network'
    ]);
  }

  confirmConnection(
    context: CareReferralContext
  ): void {
    this.careReferralService.confirmConnected(
      context.referral.id,
      context.partner.name,
      this.connectionNote ||
        'The receiving church confirmed that direct connection was completed.'
    );
    this.connectionNote = '';
  }

  releaseAcceptedReferral(
    context: CareReferralContext
  ): void {
    this.careReferralService.returnReferralToQueue(
      context.referral.id,
      this.releaseReason ||
        'The receiving church could not complete the connection.',
      context.partner.name
    );
    this.releaseReason = '';
  }

  getStatusLabel(
    status: CareReferralStatus
  ): string {
    switch (status) {
      case 'draft':
        return 'Draft';

      case 'sent':
        return 'Sent';

      case 'viewed':
        return 'Awaiting your response';

      case 'accepted':
        return 'Accepted';

      case 'declined':
        return 'Declined';

      case 'expired':
        return 'Response window expired';

      case 'cancelled':
        return 'Returned for reassignment';

      case 'connected':
        return 'Connection confirmed';
    }
  }
}
