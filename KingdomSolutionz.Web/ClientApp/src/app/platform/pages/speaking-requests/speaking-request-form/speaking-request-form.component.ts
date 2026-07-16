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
  SpeakingRequest,
  SpeakingRequestConfirmation,
  TravelBookingOwner,
  PaymentStatus,
  AgreementStatus,
  SpeakingRequestEngagementStatus
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
        Validators.maxLength(100)
      ]
    ],

    country: [
      'United States',
      Validators.required
    ],

    region: '',

    timeZone: [
      'America/New_York',
      Validators.required
    ],

    venueAddress: [
      '',
      Validators.required
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

    travelCoverageStatus:
      this.formBuilder.nonNullable.control<
        SpeakingRequestConfirmation
      >('not-determined', Validators.required),
    lodgingCoverageStatus:
      this.formBuilder.nonNullable.control<
        SpeakingRequestConfirmation
      >('not-determined', Validators.required),
    honorariumStatus:
      this.formBuilder.nonNullable.control<
        SpeakingRequestConfirmation
      >('not-determined', Validators.required),
    travelBookedBy:
      this.formBuilder.nonNullable.control<
        TravelBookingOwner
      >('not-determined', Validators.required),
    honorariumAmount: 0,
    honorariumCurrency: 'USD',
    paymentStatus:
      this.formBuilder.nonNullable.control<
        PaymentStatus
      >('not-due'),
    agreementStatus:
      this.formBuilder.nonNullable.control<
        AgreementStatus
      >('not-started'),
    engagementStatus:
      this.formBuilder.nonNullable.control<
        SpeakingRequestEngagementStatus
      >('proposed')
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
      this.controls.travelCoverageStatus.value !==
        'not-determined',
      this.controls.lodgingCoverageStatus.value !==
        'not-determined',
      this.controls.honorariumStatus.value !==
        'not-determined',
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
        .trim();

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
        value.state.trim(),

      country:
        value.country.trim(),

      region:
        value.region.trim(),

      timeZone:
        value.timeZone.trim(),

      venueAddress:
        value.venueAddress.trim(),

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
        value.travelCoverageStatus === 'yes',

      lodgingCovered:
        value.lodgingCoverageStatus === 'yes',

      honorariumProvided:
        value.honorariumStatus === 'yes',

      travelCoverageStatus:
        value.travelCoverageStatus,

      lodgingCoverageStatus:
        value.lodgingCoverageStatus,

      honorariumStatus:
        value.honorariumStatus,

      travelBookedBy:
        value.travelBookedBy,

      honorariumAmount:
        Number(value.honorariumAmount),

      honorariumCurrency:
        value.honorariumCurrency.trim().toUpperCase(),

      paymentStatus:
        value.paymentStatus,

      agreementStatus:
        value.agreementStatus,

      engagementStatus:
        value.engagementStatus
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
      country: 'United States',
      region: '',
      timeZone: 'America/New_York',
      venueAddress: '',
      venueName: '',
      startDate: '',
      endDate: '',
      ministryRequest: '',
      expectedAttendance: 0,
      travelCoverageStatus: 'not-determined',
      lodgingCoverageStatus: 'not-determined',
      honorariumStatus: 'not-determined',
      travelBookedBy: 'not-determined',
      honorariumAmount: 0,
      honorariumCurrency: 'USD',
      paymentStatus: 'not-due',
      agreementStatus: 'not-started',
      engagementStatus: 'proposed'
    });

    this.submitted = false;
    this.submittedRequest = null;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
