import {
  Component,
  OnInit
} from '@angular/core';

import {
  FormBuilder
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
  AssignmentContactDirectory
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

type ContactFormValue =
  Omit<AssignmentContact, 'category'>;

@Component({
  selector: 'app-assignment-contacts',
  templateUrl:
    './assignment-contacts.component.html',
  styleUrls: [
    './assignment-contacts.component.scss'
  ]
})
export class AssignmentContactsComponent
  implements OnInit {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  saved = false;

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
            Boolean(assignment)
        ),
        take(1)
      )
      .subscribe(assignment => {
        const directory =
          assignment.contactDirectory;

        this.form.patchValue({
          hostPastor:
            directory.hostPastor,

          hostCoordinator:
            directory.hostCoordinator,

          travelContact:
            directory.travelContact,

          mediaContact:
            directory.mediaContact,

          emergencyContact:
            directory.emergencyContact
        });
      });
  }

  saveContacts(): void {
    const value =
      this.form.getRawValue();

    const directory:
      AssignmentContactDirectory = {
        hostPastor:
          this.buildContact(
            'host-pastor',
            value.hostPastor
          ),

        hostCoordinator:
          this.buildContact(
            'host-coordinator',
            value.hostCoordinator
          ),

        travelContact:
          this.buildContact(
            'travel',
            value.travelContact
          ),

        mediaContact:
          this.buildContact(
            'media',
            value.mediaContact
          ),

        emergencyContact:
          this.buildContact(
            'emergency',
            value.emergencyContact
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
    this.saved = true;

    window.setTimeout(() => {
      this.saved = false;
    }, 2500);
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

  private createContactForm() {
    return this.formBuilder
      .nonNullable.group({
        name: '',
        role: '',
        organization: '',
        phone: '',
        email: '',
        preferredContactMethod: '',
        notes: ''
      });
  }

  private buildContact(
    category:
      AssignmentContactCategory,

    contact:
      ContactFormValue
  ): AssignmentContact {
    return {
      category,

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
}