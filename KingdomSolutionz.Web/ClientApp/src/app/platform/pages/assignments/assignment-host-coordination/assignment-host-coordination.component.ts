import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  Assignment,
  AssignmentDocumentCategory,
  AssignmentFlight,
  AssignmentHostCoordinationInput
} from '../../../shared/models/assignment.model';
import { AssignmentService } from '../../../shared/services/assignment.service';
import { SpeakerProfileService } from '../../../shared/services/speaker-profile.service';

interface HostDocumentDraft {
  id: number;
  file: File;
  category: AssignmentDocumentCategory;
  title: string;
  notes: string;
}

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
  saved = false;
  uploadError = '';
  selectedDocuments: HostDocumentDraft[] = [];

  readonly documentCategories: ReadonlyArray<{
    value: AssignmentDocumentCategory;
    label: string;
  }> = [
    { value: 'event-schedule', label: 'Event schedule' },
    { value: 'travel-confirmation', label: 'Travel confirmation' },
    { value: 'contract', label: 'Agreement or contract' },
    { value: 'promotional-asset', label: 'Promotional asset' },
    { value: 'response-resource', label: 'Response resource' },
    { value: 'host-packet', label: 'Host packet' },
    { value: 'other', label: 'Other' }
  ];

  private nextDocumentId = 1;

  readonly form = this.formBuilder.nonNullable.group({
    outboundFlight: this.createFlightForm(),
    returnFlight: this.createFlightForm(),
    hotel: this.formBuilder.nonNullable.group({
      hotelName: '',
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
    generalTravelNotes: '',
    hostPastor: this.createContactForm(),
    hostCoordinator: this.createContactForm(),
    travelContact: this.createContactForm(),
    mediaContact: this.createContactForm(),
    emergencyContact: this.createContactForm(),
    eventSchedule: '',
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
          outboundFlight: assignment.travelItinerary.outboundFlight,
          returnFlight: assignment.travelItinerary.returnFlight,
          hotel: assignment.travelItinerary.hotel,
          groundTransportation:
            assignment.travelItinerary.groundTransportation,
          generalTravelNotes:
            assignment.travelItinerary.generalNotes,
          hostPastor: directory.hostPastor,
          hostCoordinator: directory.hostCoordinator,
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
    this.uploadError = '';

    const maximumFileSize = 25 * 1024 * 1024;
    const availableSlots =
      Math.max(0, 10 - this.selectedDocuments.length);
    const files =
      Array.from(input.files ?? []).slice(0, availableSlots);

    files.forEach(file => {
      if (file.size > maximumFileSize) {
        this.uploadError =
          `${file.name} is larger than 25 MB and was not added.`;
        return;
      }

      this.selectedDocuments.push({
        id: this.nextDocumentId++,
        file,
        category: this.inferDocumentCategory(file.name),
        title: file.name.replace(/\.[^.]+$/, ''),
        notes: ''
      });
    });

    if (
      (input.files?.length ?? 0) > availableSlots
    ) {
      this.uploadError =
        'Up to 10 documents can be added in one update.';
    }

    input.value = '';
  }

  updateDocumentCategory(
    document: HostDocumentDraft,
    event: Event
  ): void {
    document.category =
      (event.target as HTMLSelectElement)
        .value as AssignmentDocumentCategory;
  }

  updateDocumentTitle(
    document: HostDocumentDraft,
    event: Event
  ): void {
    document.title =
      (event.target as HTMLInputElement).value;
  }

  updateDocumentNotes(
    document: HostDocumentDraft,
    event: Event
  ): void {
    document.notes =
      (event.target as HTMLTextAreaElement).value;
  }

  removeDocument(documentId: number): void {
    this.selectedDocuments =
      this.selectedDocuments.filter(
        document => document.id !== documentId
      );
  }

  saveProgress(assignment: Assignment): void {
    if (!this.persist(assignment, false)) {
      return;
    }

    this.saved = true;

    window.setTimeout(() => {
      this.saved = false;
    }, 3000);
  }

  submit(assignment: Assignment): void {
    if (!this.persist(assignment, true)) {
      return;
    }

    this.submitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatFileSize(fileSizeBytes: number): string {
    if (fileSizeBytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`;
    }

    return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private persist(
    assignment: Assignment,
    submitForReview: boolean
  ): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    const value = this.form.getRawValue();
    const input: AssignmentHostCoordinationInput = {
      ...value,
      outboundFlight: this.normalizeFlight(
        'outbound',
        value.outboundFlight
      ),
      returnFlight: this.normalizeFlight(
        'return',
        value.returnFlight
      ),
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
      },
      generalTravelNotes:
        value.generalTravelNotes.trim(),
      hostPastor:
        this.normalizeContact(value.hostPastor),
      hostCoordinator:
        this.normalizeContact(value.hostCoordinator),
      travelContact:
        this.normalizeContact(value.travelContact),
      mediaContact:
        this.normalizeContact(value.mediaContact),
      emergencyContact:
        this.normalizeContact(value.emergencyContact),
      eventSchedule: value.eventSchedule.trim(),
      promotionalRequirements:
        value.promotionalRequirements.trim(),
      prayerFocus: value.prayerFocus.trim(),
      hostNotes: value.hostNotes.trim()
    };

    const actor =
      input.hostCoordinator.name ||
      assignment.contactDirectory.hostCoordinator.name ||
      'Host team';

    if (submitForReview) {
      this.assignmentService.submitHostCoordination(
        assignment.id,
        input,
        actor
      );
    } else {
      this.assignmentService.saveHostCoordination(
        assignment.id,
        input,
        actor
      );
    }

    this.selectedDocuments.forEach(document => {
      this.assignmentService.addDocument(assignment.id, {
        category: document.category,
        title:
          document.title.trim() ||
          document.file.name.replace(/\.[^.]+$/, ''),
        fileName: document.file.name,
        fileSizeBytes: document.file.size,
        mimeType:
          document.file.type || 'application/octet-stream',
        uploadedBy: actor,
        notes:
          document.notes.trim() ||
          'Submitted through the host coordination link.',
        objectUrl: URL.createObjectURL(document.file)
      });
    });

    this.selectedDocuments = [];
    return true;
  }

  private createContactForm() {
    return this.formBuilder.nonNullable.group({
      name: '',
      role: '',
      phone: '',
      email: ''
    });
  }

  private createFlightForm() {
    return this.formBuilder.nonNullable.group({
      airline: '',
      flightNumber: '',
      confirmationNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      departureDate: '',
      departureTime: '',
      arrivalDate: '',
      arrivalTime: '',
      seat: '',
      notes: ''
    });
  }

  private normalizeContact(
    value: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }
  ) {
    return {
      name: value.name.trim(),
      role: value.role.trim(),
      phone: value.phone.trim(),
      email: value.email.trim().toLowerCase()
    };
  }

  private inferDocumentCategory(
    fileName: string
  ): AssignmentDocumentCategory {
    const normalized = fileName.toLowerCase();

    if (/schedule|agenda|run-of-show/.test(normalized)) {
      return 'event-schedule';
    }

    if (/flight|hotel|travel|itinerary|confirmation/.test(normalized)) {
      return 'travel-confirmation';
    }

    if (/contract|agreement|terms/.test(normalized)) {
      return 'contract';
    }

    if (/promo|graphic|flyer|photo|bio/.test(normalized)) {
      return 'promotional-asset';
    }

    if (/response|qr|follow-up/.test(normalized)) {
      return 'response-resource';
    }

    if (/host|packet/.test(normalized)) {
      return 'host-packet';
    }

    return 'other';
  }

  private normalizeFlight(
    type: AssignmentFlight['type'],
    value: Omit<AssignmentFlight, 'type'>
  ): AssignmentFlight {
    return {
      type,
      airline: value.airline.trim(),
      flightNumber: value.flightNumber.trim().toUpperCase(),
      confirmationNumber:
        value.confirmationNumber.trim().toUpperCase(),
      departureAirport:
        value.departureAirport.trim().toUpperCase(),
      arrivalAirport:
        value.arrivalAirport.trim().toUpperCase(),
      departureDate: value.departureDate,
      departureTime: value.departureTime,
      arrivalDate: value.arrivalDate,
      arrivalTime: value.arrivalTime,
      seat: value.seat.trim().toUpperCase(),
      notes: value.notes.trim()
    };
  }
}
