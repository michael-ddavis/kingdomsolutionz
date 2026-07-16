import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterModule
} from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  SpeakingRequest,
  SpeakingRequestCommunication,
  SpeakingRequestConfirmation,
  TravelBookingOwner
} from '../../../shared/models/speaking-request.model';
import {
  SpeakingRequestService
} from '../../../shared/services/speaking-request.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  selector:
    'app-speaking-request-host-response',
  templateUrl:
    './speaking-request-host-response.component.html',
  styleUrls: [
    './speaking-request-host-response.component.scss'
  ]
})
export class SpeakingRequestHostResponseComponent implements OnInit {
  private readonly requestId =
    Number(
      this.route.snapshot.paramMap.get('id')
    );

  submitted = false;

  readonly request$:
    Observable<SpeakingRequest | undefined> =
      this.speakingRequestService
        .getSpeakingRequest(this.requestId);

  readonly responseForm =
    this.formBuilder.nonNullable.group({
      message:
        this.formBuilder.nonNullable.control(
          '',
          [
            Validators.required,
            Validators.maxLength(1500)
          ]
        ),
      contactPhone: '',
      country: '',
      region: '',
      timeZone: '',
      venueAddress: '',
      travelCoverageStatus:
        this.formBuilder.nonNullable.control<SpeakingRequestConfirmation>('not-determined'),
      lodgingCoverageStatus:
        this.formBuilder.nonNullable.control<SpeakingRequestConfirmation>('not-determined'),
      honorariumStatus:
        this.formBuilder.nonNullable.control<SpeakingRequestConfirmation>('not-determined'),
      travelBookedBy:
        this.formBuilder.nonNullable.control<TravelBookingOwner>('not-determined')
    });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly speakingRequestService:
      SpeakingRequestService
  ) {}

  ngOnInit(): void {
    this.request$
      .pipe(
        filter((request): request is SpeakingRequest => Boolean(request)),
        take(1)
      )
      .subscribe(request => {
        this.responseForm.patchValue({
          contactPhone: request.contactPhone,
          country: request.country,
          region: request.region,
          timeZone: request.timeZone,
          venueAddress: request.venueAddress,
          travelCoverageStatus: request.travelCoverageStatus,
          lodgingCoverageStatus: request.lodgingCoverageStatus,
          honorariumStatus: request.honorariumStatus,
          travelBookedBy: request.travelBookedBy
        });
      });
  }

  getLatestInformationRequest(
    request: SpeakingRequest
  ): SpeakingRequestCommunication | undefined {
    return [...request.communications]
      .reverse()
      .find(
        communication =>
          communication.type ===
            'information-requested'
      );
  }

  submitResponse(): void {
    if (this.responseForm.invalid) {
      this.responseForm.markAllAsTouched();
      return;
    }

    const value = this.responseForm.getRawValue();

    this.speakingRequestService
      .submitHostResponse(
        this.requestId,
        value.message,
        {
          contactPhone: value.contactPhone.trim(),
          country: value.country.trim(),
          region: value.region.trim(),
          timeZone: value.timeZone.trim(),
          venueAddress: value.venueAddress.trim(),
          travelCoverageStatus: value.travelCoverageStatus,
          lodgingCoverageStatus: value.lodgingCoverageStatus,
          honorariumStatus: value.honorariumStatus,
          travelBookedBy: value.travelBookedBy
        }
      );

    this.submitted = true;
  }
}
