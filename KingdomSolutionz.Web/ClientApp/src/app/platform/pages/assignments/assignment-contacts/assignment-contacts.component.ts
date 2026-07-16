import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup
} from '@angular/forms';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable,
  filter,
  take
} from 'rxjs';

import {
  Assignment,
  AssignmentContact,
  AssignmentContactCategory,
  AssignmentContactDirectory,
  AssignmentContactMethod,
  AssignmentDataSource
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

interface ContactFormValue {
  name: string;
  role: string;
  organization: string;
  phone: string;
  email: string;

  preferredContactMethod:
    AssignmentContactMethod;

  notes: string;
}

type ContactFormGroup =
  FormGroup<{
    name: FormControl<string>;
    role: FormControl<string>;
    organization: FormControl<string>;
    phone: FormControl<string>;
    email: FormControl<string>;

    preferredContactMethod:
      FormControl<AssignmentContactMethod>;

    notes: FormControl<string>;
  }>;

type ReusableContactControl =
  | 'hostPastor'
  | 'travelContact'
  | 'mediaContact'
  | 'emergencyContact';

@Component({
  standalone: false,
  selector: 'app-assignment-contacts',

  templateUrl:
    './assignment-contacts.component.html',

  styleUrls: [
    './assignment-contacts.component.scss'
  ]
})
export class AssignmentContactsComponent
  implements OnInit, OnDestroy {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  private savedMessageTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  saved = false;

  private readonly contactSources:
    Record<
      AssignmentContactCategory,
      AssignmentDataSource
    > = {
      'host-pastor': 'assignment',
      'host-coordinator': 'assignment',
      travel: 'assignment',
      media: 'assignment',
      emergency: 'assignment'
    };

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  readonly form =
    this.formBuilder.nonNullable.group({
      hostPastor:
        this.createContactForm(),

      hostCoordinator:
        this.createContactForm(),

      travelContact:
        this.createContactForm(),

      mediaContact:
        this.createContactForm(),

      emergencyContact:
        this.createContactForm()
    });

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly formBuilder:
      FormBuilder,

    private readonly assignmentService:
      AssignmentService
  ) {}

  ngOnInit(): void {
    this.assignment$
      .pipe(
        filter(
          (
            assignment
          ): assignment is Assignment =>
            assignment !== undefined
        ),

        take(1)
      )
      .subscribe(assignment => {
        const directory =
          assignment.contactDirectory;

        this.contactSources[
          'host-pastor'
        ] = directory.hostPastor.source;

        this.contactSources[
          'host-coordinator'
        ] = directory.hostCoordinator.source;

        this.contactSources.travel =
          directory.travelContact.source;

        this.contactSources.media =
          directory.mediaContact.source;

        this.contactSources.emergency =
          directory.emergencyContact.source;

        this.form.patchValue({
          hostPastor: {
            name:
              directory.hostPastor.name,

            role:
              directory.hostPastor.role,

            organization:
              directory.hostPastor
                .organization,

            phone:
              directory.hostPastor.phone,

            email:
              directory.hostPastor.email,

            preferredContactMethod:
              directory.hostPastor
                .preferredContactMethod,

            notes:
              directory.hostPastor.notes
          },

          hostCoordinator: {
            name:
              directory.hostCoordinator
                .name,

            role:
              directory.hostCoordinator
                .role,

            organization:
              directory.hostCoordinator
                .organization,

            phone:
              directory.hostCoordinator
                .phone,

            email:
              directory.hostCoordinator
                .email,

            preferredContactMethod:
              directory.hostCoordinator
                .preferredContactMethod,

            notes:
              directory.hostCoordinator
                .notes
          },

          travelContact: {
            name:
              directory.travelContact.name,

            role:
              directory.travelContact.role,

            organization:
              directory.travelContact
                .organization,

            phone:
              directory.travelContact.phone,

            email:
              directory.travelContact.email,

            preferredContactMethod:
              directory.travelContact
                .preferredContactMethod,

            notes:
              directory.travelContact.notes
          },

          mediaContact: {
            name:
              directory.mediaContact.name,

            role:
              directory.mediaContact.role,

            organization:
              directory.mediaContact
                .organization,

            phone:
              directory.mediaContact.phone,

            email:
              directory.mediaContact.email,

            preferredContactMethod:
              directory.mediaContact
                .preferredContactMethod,

            notes:
              directory.mediaContact.notes
          },

          emergencyContact: {
            name:
              directory.emergencyContact
                .name,

            role:
              directory.emergencyContact
                .role,

            organization:
              directory.emergencyContact
                .organization,

            phone:
              directory.emergencyContact
                .phone,

            email:
              directory.emergencyContact
                .email,

            preferredContactMethod:
              directory.emergencyContact
                .preferredContactMethod,

            notes:
              directory.emergencyContact
                .notes
          }
        });

        this.form.markAsPristine();
      });
  }

  ngOnDestroy(): void {
    if (this.savedMessageTimer) {
      clearTimeout(
        this.savedMessageTimer
      );
    }
  }

  saveContacts(): void {
    const value =
      this.form.getRawValue();

    const directory:
      AssignmentContactDirectory = {
        hostPastor:
          this.buildContact(
            'host-pastor',
            value.hostPastor,
            this.contactSources[
              'host-pastor'
            ]
          ),

        hostCoordinator:
          this.buildContact(
            'host-coordinator',
            value.hostCoordinator,
            this.contactSources[
              'host-coordinator'
            ]
          ),

        travelContact:
          this.buildContact(
            'travel',
            value.travelContact,
            this.contactSources.travel
          ),

        mediaContact:
          this.buildContact(
            'media',
            value.mediaContact,
            this.contactSources.media
          ),

        emergencyContact:
          this.buildContact(
            'emergency',
            value.emergencyContact,
            this.contactSources.emergency
          ),

        readinessPercentage: 0,
        lastUpdatedUtc: null
      };

    this.assignmentService
      .updateContactDirectory(
        this.assignmentId,
        directory
      );

    this.form.markAsPristine();

    this.showSavedMessage();
  }

  isContactComplete(
    contact: AssignmentContact
  ): boolean {
    return Boolean(
      contact.name.trim() &&
      (
        contact.phone.trim() ||
        contact.email.trim()
      )
    );
  }

  getCompletedContactCount(
    directory:
      AssignmentContactDirectory
  ): number {
    const contacts:
      AssignmentContact[] = [
        directory.hostPastor,
        directory.hostCoordinator,
        directory.travelContact,
        directory.mediaContact,
        directory.emergencyContact
      ];

    return contacts.filter(
      contact =>
        this.isContactComplete(
          contact
        )
    ).length;
  }

  canReuseHostContact(): boolean {
    const hostContact =
      this.form.controls
        .hostCoordinator
        .getRawValue();

    return Boolean(
      hostContact.name.trim() &&
      (
        hostContact.phone.trim() ||
        hostContact.email.trim()
      )
    );
  }

  reuseHostContact(
    target: ReusableContactControl,
    defaultRole: string
  ): void {
    if (!this.canReuseHostContact()) {
      return;
    }

    const source =
      this.form.controls
        .hostCoordinator
        .getRawValue();

    const targetControl =
      this.form.controls[target];

    targetControl.patchValue({
      name: source.name,
      role: source.role || defaultRole,
      organization: source.organization,
      phone: source.phone,
      email: source.email,
      preferredContactMethod: source.preferredContactMethod,
      notes: source.notes ||
        'Same person as the primary host contact.'
    });

    targetControl.markAsDirty();
  }

  private createContactForm():
    ContactFormGroup {
    return this.formBuilder
      .nonNullable.group({
        name:
          this.formBuilder
            .nonNullable
            .control(''),

        role:
          this.formBuilder
            .nonNullable
            .control(''),

        organization:
          this.formBuilder
            .nonNullable
            .control(''),

        phone:
          this.formBuilder
            .nonNullable
            .control(''),

        email:
          this.formBuilder
            .nonNullable
            .control(''),

        preferredContactMethod:
          this.formBuilder
            .nonNullable
            .control<AssignmentContactMethod>(
              ''
            ),

        notes:
          this.formBuilder
            .nonNullable
            .control('')
      });
  }

  private buildContact(
    category:
      AssignmentContactCategory,

    contact: ContactFormValue,

    source: AssignmentDataSource
  ): AssignmentContact {
    return {
      category,
      source,

      name:
        contact.name.trim(),

      role:
        contact.role.trim(),

      organization:
        contact.organization.trim(),

      phone:
        contact.phone.trim(),

      email:
        contact.email
          .trim()
          .toLowerCase(),

      preferredContactMethod:
        contact.preferredContactMethod,

      notes:
        contact.notes.trim()
    };
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
