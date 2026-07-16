import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  CreateSpeakingRequestInput,
  SpeakingRequest
} from '../../../shared/models/speaking-request.model';

import {
  SpeakingRequestService
} from '../../../shared/services/speaking-request.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  selector: 'app-speaking-request-form',
  templateUrl: './speaking-request-form.component.html',
  styleUrls: ['./speaking-request-form.component.scss']
})
export class SpeakingRequestFormComponent {
  submitted = false;
  submittedRequest: SpeakingRequest | null = null;

  readonly eventTypes = [
    'Sunday Service',
    'Leadership Intensive',
    'Women’s Conference',
    'Worship and Prayer Gathering',
    'Prophetic Gathering',
    'Youth or Young Adult Event',
    'Conference',
    'Prayer Gathering',
    'Other'
  ];

  readonly form = this.formBuilder.nonNullable.group({
    organizationName: [
      '',
      [
        Validators.required,
        Validators.maxLength(150)
      ]
    ],

    eventName: [
      '',
      [
        Validators.required,
        Validators.maxLength(150)
      ]
    ],

    eventType: [
      '',
      Validators.required
    ],

    contactName: [
      '',
      [
        Validators.required,
        Validators.maxLength(120)
      ]
    ],

    contactEmail: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    contactPhone: [
      '',
      [
        Validators.required,
        Validators.maxLength(30)
      ]
    ],

    city: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],

    state: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z]{2}$/)
      ]
    ],

    venueName: [
      '',
      [
        Validators.required,
        Validators.maxLength(150)
      ]
    ],

    startDate: [
      '',
      Validators.required
    ],

    endDate: [
      '',
      Validators.required
    ],

    ministryRequest: [
      '',
      [
        Validators.required,
        Validators.maxLength(1500)
      ]
    ],

    expectedAttendance: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(100000)
      ]
    ],

    travelCovered: false,
    lodgingCovered: false,
    honorariumProvided: false
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly speakingRequestService:
      SpeakingRequestService
  ) {}

  get controls() {
    return this.form.controls;
  }

  get dateRangeInvalid(): boolean {
    const startDate = this.controls.startDate.value;
    const endDate = this.controls.endDate.value;

    return Boolean(
      startDate &&
      endDate &&
      endDate < startDate
    );
  }

  get eventDetailsComplete(): boolean {
    return Boolean(
      this.controls.eventName.value.trim() &&
      this.controls.eventType.value &&
      this.controls.venueName.value.trim() &&
      this.controls.startDate.value &&
      this.controls.endDate.value &&
      !this.dateRangeInvalid
    );
  }

  get contactDetailsComplete(): boolean {
    return Boolean(
      this.controls.contactName.value.trim() &&
      this.controls.contactEmail.valid &&
      this.controls.contactPhone.value.trim()
    );
  }

  get ministryRequestComplete(): boolean {
    return Boolean(
      this.controls.ministryRequest.value.trim()
    );
  }

  get attendanceComplete(): boolean {
    return this.controls.expectedAttendance.value > 0;
  }

  get readinessPercentage(): number {
    const readinessChecks = [
      this.eventDetailsComplete,
      this.contactDetailsComplete,
      this.controls.travelCovered.value,
      this.controls.lodgingCovered.value,
      this.controls.honorariumProvided.value,
      this.ministryRequestComplete,
      this.attendanceComplete
    ];

    const completedChecks = readinessChecks.filter(
      item => item
    ).length;

    return Math.round(
      (completedChecks / readinessChecks.length) * 100
    );
  }

  isInvalid(control: AbstractControl): boolean {
    return control.invalid &&
      (control.touched || this.submitted);
  }

  normalizeState(): void {
    const normalizedState =
      this.controls.state.value
        .trim()
        .toUpperCase()
        .slice(0, 2);

    this.controls.state.setValue(
      normalizedState,
      {
        emitEvent: false
      }
    );
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid || this.dateRangeInvalid) {
      this.form.markAllAsTouched();

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;
    }

    const value = this.form.getRawValue();

    const requestInput: CreateSpeakingRequestInput = {
      organizationName:
        value.organizationName.trim(),

      eventName:
        value.eventName.trim(),

      eventType:
        value.eventType,

      contactName:
        value.contactName.trim(),

      contactEmail:
        value.contactEmail.trim().toLowerCase(),

      contactPhone:
        value.contactPhone.trim(),

      city:
        value.city.trim(),

      state:
        value.state.trim().toUpperCase(),

      venueName:
        value.venueName.trim(),

      startDate:
        value.startDate,

      endDate:
        value.endDate,

      ministryRequest:
        value.ministryRequest.trim(),

      expectedAttendance:
        Number(value.expectedAttendance),

      travelCovered:
        value.travelCovered,

      lodgingCovered:
        value.lodgingCovered,

      honorariumProvided:
        value.honorariumProvided
    };

    this.submittedRequest =
      this.speakingRequestService.addSpeakingRequest(
        requestInput
      );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  submitAnotherInvitation(): void {
    this.form.reset({
      organizationName: '',
      eventName: '',
      eventType: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      city: '',
      state: '',
      venueName: '',
      startDate: '',
      endDate: '',
      ministryRequest: '',
      expectedAttendance: 0,
      travelCovered: false,
      lodgingCovered: false,
      honorariumProvided: false
    });

    this.submitted = false;
    this.submittedRequest = null;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
