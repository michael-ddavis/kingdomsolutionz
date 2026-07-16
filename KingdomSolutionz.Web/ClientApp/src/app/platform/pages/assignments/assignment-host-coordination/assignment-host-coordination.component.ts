import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  Assignment,
  AssignmentHostCoordinationInput
} from '../../../shared/models/assignment.model';
import { AssignmentService } from '../../../shared/services/assignment.service';
import { SpeakerProfileService } from '../../../shared/services/speaker-profile.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-assignment-host-coordination',
  templateUrl: './assignment-host-coordination.component.html',
  styleUrls: ['./assignment-host-coordination.component.scss']
})
export class AssignmentHostCoordinationComponent implements OnInit {
  private readonly assignmentId =
    Number(this.route.snapshot.paramMap.get('id'));

  readonly assignment$: Observable<Assignment | undefined> =
    this.assignmentService.getAssignment(this.assignmentId);

  readonly speakerProfile$ =
    this.speakerProfileService.profile$;

  submitted = false;
  selectedFiles: File[] = [];

  readonly form = this.formBuilder.nonNullable.group({
    hotel: this.formBuilder.nonNullable.group({
      hotelName: ['', Validators.required],
      confirmationNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      checkInDate: '',
      checkInTime: '',
      checkOutDate: '',
      checkOutTime: '',
      phone: '',
      notes: ''
    }),
    groundTransportation: this.formBuilder.nonNullable.group({
      arrivalPickupContact: '',
      arrivalPickupPhone: '',
      arrivalPickupInstructions: '',
      localTransportationDetails: '',
      departurePickupContact: '',
      departurePickupPhone: '',
      departurePickupInstructions: ''
    }),
    travelContact: this.createContactForm(),
    mediaContact: this.createContactForm(),
    emergencyContact: this.createContactForm(),
    eventSchedule: ['', Validators.required],
    promotionalRequirements: '',
    prayerFocus: '',
    hostNotes: ''
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly assignmentService: AssignmentService,
    private readonly speakerProfileService: SpeakerProfileService
  ) {}

  ngOnInit(): void {
    this.assignment$
      .pipe(
        filter((assignment): assignment is Assignment => Boolean(assignment)),
        take(1)
      )
      .subscribe(assignment => {
        const directory = assignment.contactDirectory;

        this.form.patchValue({
          hotel: assignment.travelItinerary.hotel,
          groundTransportation:
            assignment.travelItinerary.groundTransportation,
          travelContact: directory.travelContact,
          mediaContact: directory.mediaContact,
          emergencyContact: directory.emergencyContact,
          eventSchedule: assignment.hostCoordination.eventSchedule,
          promotionalRequirements:
            assignment.hostCoordination.promotionalRequirements,
          prayerFocus: assignment.hostCoordination.prayerFocus,
          hostNotes: assignment.hostCoordination.hostNotes
        });
      });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(input.files ?? []).slice(0, 5);
  }

  submit(assignment: Assignment): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: AssignmentHostCoordinationInput = {
      ...value,
      hotel: {
        ...value.hotel,
        hotelName: value.hotel.hotelName.trim(),
        confirmationNumber:
          value.hotel.confirmationNumber.trim().toUpperCase(),
        address: value.hotel.address.trim(),
        city: value.hotel.city.trim(),
        state: value.hotel.state.trim(),
        postalCode: value.hotel.postalCode.trim(),
        phone: value.hotel.phone.trim(),
        notes: value.hotel.notes.trim()
      }
    };

    this.assignmentService.submitHostCoordination(
      assignment.id,
      input,
      assignment.contactDirectory.hostCoordinator.name || 'Host team'
    );

    this.selectedFiles.forEach(file => {
      this.assignmentService.addDocument(assignment.id, {
        category: 'host-packet',
        title: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        uploadedBy:
          assignment.contactDirectory.hostCoordinator.name || 'Host team',
        notes: 'Submitted through the host coordination link.',
        objectUrl: URL.createObjectURL(file)
      });
    });

    this.submitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private createContactForm() {
    return this.formBuilder.nonNullable.group({
      name: '',
      role: '',
      phone: '',
      email: ''
    });
  }
}
