import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { SpeakerProfile } from '../models/speaker-profile.model';

@Injectable({ providedIn: 'root' })
export class SpeakerProfileService {
  private readonly profileSubject =
    new BehaviorSubject<SpeakerProfile>({
      name: 'Cynthia Thompson Global',
      ministryTitle: 'Apostolic Leader · Author · Global Speaker',
      shortBio:
        'Cynthia Thompson Global equips leaders, strengthens churches and ministers with a prophetic and apostolic grace across nations.',
      approvedPhotoUrl:
        'assets/images/apostle-cynthia/booking-portrait.avif',
      travelPreferences:
        'Aisle seat when available; nonstop flights preferred; final itinerary shared with the assignment coordinator.',
      dietaryNeeds:
        'Light, health-conscious meals; bottled water available before ministry.',
      accessibilityNeeds:
        'Allow a quiet preparation area near the platform and minimize unnecessary transfers on travel days.',
      standardDocuments: [
        'Approved short biography',
        'Approved ministry photograph',
        'Introduction and protocol guide',
        'W-9 / payment information'
      ],
      ministryTeamContacts: [
        {
          name: 'Michael Davis',
          role: 'Assignment Coordinator',
          email: 'michael@kingdomsolutionz.com',
          phone: '+1 804 555 0140'
        }
      ],
      lastUpdatedUtc: '2026-07-16T12:00:00.000Z'
    });

  readonly profile$ = this.profileSubject.asObservable();

  updateProfile(profile: SpeakerProfile): void {
    this.profileSubject.next({
      ...profile,
      lastUpdatedUtc: new Date().toISOString()
    });
  }
}
