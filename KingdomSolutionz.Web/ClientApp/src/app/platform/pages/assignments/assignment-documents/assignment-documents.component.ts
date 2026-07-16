import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import {
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Observable
} from 'rxjs';

import {
  Assignment,
  AssignmentDocument,
  AssignmentDocumentCategory
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

interface RequiredDocumentType {
  category: AssignmentDocumentCategory;
  label: string;
  description: string;
}

@Component({
  standalone: false,
  selector: 'app-assignment-documents',
  templateUrl:
    './assignment-documents.component.html',
  styleUrls: [
    './assignment-documents.component.scss'
  ]
})
export class AssignmentDocumentsComponent {
  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  selectedFile: File | null = null;

  uploadError = '';
  uploaded = false;

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  readonly categoryLabels:
    Record<
      AssignmentDocumentCategory,
      string
    > = {
      contract: 'Contract',
      'event-schedule': 'Event schedule',
      'travel-confirmation':
        'Travel confirmation',
      'promotional-asset':
        'Promotional asset',
      'response-resource':
        'Response resource',
      'host-packet': 'Host packet',
      'sermon-notes': 'Sermon notes',
      other: 'Other'
    };

  readonly requiredDocumentTypes:
    RequiredDocumentType[] = [
      {
        category: 'contract',
        label: 'Contract',
        description:
          'Agreement or engagement terms'
      },
      {
        category: 'event-schedule',
        label: 'Event schedule',
        description:
          'Service and session times'
      },
      {
        category: 'travel-confirmation',
        label: 'Travel confirmation',
        description:
          'Flight or hotel confirmation'
      },
      {
        category: 'promotional-asset',
        label: 'Promotional assets',
        description:
          'Approved graphics or biography'
      },
      {
        category: 'response-resource',
        label: 'Response resources',
        description:
          'QR codes, forms or handoff material'
      },
      {
        category: 'host-packet',
        label: 'Host packet',
        description:
          'Final host information packet'
      }
    ];

  readonly uploadForm =
    this.formBuilder.nonNullable.group({
      category:
        this.formBuilder
          .nonNullable
          .control<AssignmentDocumentCategory>(
            'contract'
          ),

      title: this.formBuilder
        .nonNullable
        .control(
          '',
          [
            Validators.required,
            Validators.maxLength(120)
          ]
        ),

      notes: this.formBuilder
        .nonNullable
        .control('')
    });

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly formBuilder:
      FormBuilder,

    private readonly assignmentService:
      AssignmentService
  ) {}

  onFileSelected(
    event: Event
  ): void {
    this.uploadError = '';

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const maximumFileSize =
      25 * 1024 * 1024;

    if (
      file.size > maximumFileSize
    ) {
      this.selectedFile = null;

      this.uploadError =
        'The selected file is larger than 25 MB.';

      input.value = '';

      return;
    }

    this.selectedFile = file;

    if (
      !this.uploadForm.controls
        .title.value.trim()
    ) {
      this.uploadForm.controls
        .title
        .setValue(
          this.removeFileExtension(
            file.name
          )
        );
    }
  }

  uploadDocument(): void {
    this.uploadError = '';

    if (!this.selectedFile) {
      this.uploadError =
        'Select a file before uploading.';

      return;
    }

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();

      this.uploadError =
        'Enter a title for the document.';

      return;
    }

    const value =
      this.uploadForm.getRawValue();

    const objectUrl =
      URL.createObjectURL(
        this.selectedFile
      );

    this.assignmentService.addDocument(
      this.assignmentId,
      {
        category:
          value.category,

        title:
          value.title.trim(),

        fileName:
          this.selectedFile.name,

        fileSizeBytes:
          this.selectedFile.size,

        mimeType:
          this.selectedFile.type ||
          'application/octet-stream',

        uploadedBy:
          'Michael Davis',

        notes:
          value.notes.trim(),

        objectUrl
      }
    );

    this.selectedFile = null;

    this.uploadForm.reset({
      category: 'contract',
      title: '',
      notes: ''
    });

    if (this.fileInput) {
      this.fileInput
        .nativeElement
        .value = '';
    }

    this.uploaded = true;

    window.setTimeout(() => {
      this.uploaded = false;
    }, 2500);
  }

  openDocument(
    document: AssignmentDocument
  ): void {
    if (!document.objectUrl) {
      return;
    }

    window.open(
      document.objectUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  removeDocument(
    document: AssignmentDocument
  ): void {
    const shouldRemove =
      window.confirm(
        `Remove "${document.title}" from this assignment?`
      );

    if (!shouldRemove) {
      return;
    }

    if (
      document.objectUrl.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        document.objectUrl
      );
    }

    this.assignmentService
      .removeDocument(
        this.assignmentId,
        document.id
      );
  }

  hasCategory(
    assignment: Assignment,
    category:
      AssignmentDocumentCategory
  ): boolean {
    return assignment
      .documentLibrary
      .documents
      .some(
        document =>
          document.category === category
      );
  }

  getSortedDocuments(
    assignment: Assignment
  ): AssignmentDocument[] {
    return [
      ...assignment
        .documentLibrary
        .documents
    ].sort(
      (left, right) =>
        new Date(
          right.uploadedUtc
        ).getTime() -
        new Date(
          left.uploadedUtc
        ).getTime()
    );
  }

  formatFileSize(
    sizeInBytes: number
  ): string {
    if (
      sizeInBytes < 1024
    ) {
      return `${sizeInBytes} B`;
    }

    if (
      sizeInBytes <
      1024 * 1024
    ) {
      return `${
        (
          sizeInBytes /
          1024
        ).toFixed(1)
      } KB`;
    }

    return `${
      (
        sizeInBytes /
        (
          1024 * 1024
        )
      ).toFixed(1)
    } MB`;
  }

  trackByDocumentId(
    _index: number,
    document: AssignmentDocument
  ): number {
    return document.id;
  }

  private removeFileExtension(
    fileName: string
  ): string {
    const lastDotIndex =
      fileName.lastIndexOf('.');

    if (
      lastDotIndex <= 0
    ) {
      return fileName;
    }

    return fileName.slice(
      0,
      lastDotIndex
    );
  }
}