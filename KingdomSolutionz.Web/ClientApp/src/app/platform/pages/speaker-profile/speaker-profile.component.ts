import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { SpeakerProfile } from '../../shared/models/speaker-profile.model';
import { SpeakerProfileService } from '../../shared/services/speaker-profile.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-speaker-profile',
  templateUrl: './speaker-profile.component.html',
  styleUrls: ['./speaker-profile.component.scss']
})
export class SpeakerProfileComponent implements OnInit {
  saved = false;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    ministryTitle: ['', Validators.required],
    shortBio: ['', Validators.required],
    approvedPhotoUrl: '',
    travelPreferences: '',
    dietaryNeeds: '',
    accessibilityNeeds: '',
    standardDocuments: this.formBuilder.nonNullable.array<string>([]),
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: ''
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly speakerProfileService: SpeakerProfileService
  ) {}

  ngOnInit(): void {
    this.speakerProfileService.profile$
      .pipe(take(1))
      .subscribe(profile => {
        this.form.patchValue({
          ...profile,
          contactName: profile.ministryTeamContacts[0]?.name ?? '',
          contactRole: profile.ministryTeamContacts[0]?.role ?? '',
          contactEmail: profile.ministryTeamContacts[0]?.email ?? '',
          contactPhone: profile.ministryTeamContacts[0]?.phone ?? ''
        });
        profile.standardDocuments.forEach(document =>
          this.standardDocuments.push(
            this.formBuilder.nonNullable.control(document)
          )
        );
      });
  }

  get standardDocuments(): FormArray {
    return this.form.controls.standardDocuments;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const profile: SpeakerProfile = {
      name: value.name.trim(),
      ministryTitle: value.ministryTitle.trim(),
      shortBio: value.shortBio.trim(),
      approvedPhotoUrl: value.approvedPhotoUrl,
      travelPreferences: value.travelPreferences.trim(),
      dietaryNeeds: value.dietaryNeeds.trim(),
      accessibilityNeeds: value.accessibilityNeeds.trim(),
      standardDocuments: value.standardDocuments,
      ministryTeamContacts: [{
        name: value.contactName.trim(),
        role: value.contactRole.trim(),
        email: value.contactEmail.trim(),
        phone: value.contactPhone.trim()
      }],
      lastUpdatedUtc: ''
    };
    this.speakerProfileService.updateProfile(profile);
    this.saved = true;
    window.setTimeout(() => this.saved = false, 2200);
  }
}
