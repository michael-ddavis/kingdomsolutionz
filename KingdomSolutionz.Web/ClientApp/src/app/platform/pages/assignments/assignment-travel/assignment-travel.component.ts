import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  Assignment,
  AssignmentFlight,
  AssignmentTravelItinerary
} from '../../../shared/models/assignment.model';
import { AssignmentService } from '../../../shared/services/assignment.service';

type FlightFormValue = Omit<AssignmentFlight, 'type'>;

@Component({
  standalone: false,
  selector: 'app-assignment-travel',
  templateUrl: './assignment-travel.component.html',
  styleUrls: ['./assignment-travel.component.scss']
})
export class AssignmentTravelComponent implements OnInit {
  private readonly assignmentId = Number(
    this.route.parent?.snapshot.paramMap.get('id')
  );

  saved = false;

  readonly assignment$: Observable<Assignment | undefined> =
    this.assignmentService.getAssignment(this.assignmentId);

  readonly form = this.formBuilder.nonNullable.group({
    outboundFlight: this.flightGroup(),
    returnFlight: this.flightGroup(),
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
    generalNotes: ''
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly assignmentService: AssignmentService
  ) {}

  ngOnInit(): void {
    this.assignment$.pipe(
      filter((assignment): assignment is Assignment => Boolean(assignment)),
      take(1)
    ).subscribe(assignment => {
      const itinerary = assignment.travelItinerary;
      const travelContact = assignment.contactDirectory.travelContact;
      this.form.patchValue({
        outboundFlight: itinerary.outboundFlight,
        returnFlight: itinerary.returnFlight,
        hotel: itinerary.hotel,
        groundTransportation: {
          ...itinerary.groundTransportation,
          arrivalPickupContact:
            itinerary.groundTransportation.arrivalPickupContact || travelContact.name,
          arrivalPickupPhone:
            itinerary.groundTransportation.arrivalPickupPhone || travelContact.phone,
          departurePickupContact:
            itinerary.groundTransportation.departurePickupContact || travelContact.name,
          departurePickupPhone:
            itinerary.groundTransportation.departurePickupPhone || travelContact.phone
        },
        generalNotes: itinerary.generalNotes
      });
    });
  }

  saveItinerary(): void {
    const value = this.form.getRawValue();
    const itinerary: AssignmentTravelItinerary = {
      outboundFlight: this.buildFlight('outbound', value.outboundFlight),
      returnFlight: this.buildFlight('return', value.returnFlight),
      hotel: {
        ...value.hotel,
        hotelName: value.hotel.hotelName.trim(),
        confirmationNumber: value.hotel.confirmationNumber.trim().toUpperCase(),
        address: value.hotel.address.trim(),
        city: value.hotel.city.trim(),
        state: value.hotel.state.trim().toUpperCase(),
        postalCode: value.hotel.postalCode.trim(),
        phone: value.hotel.phone.trim(),
        notes: value.hotel.notes.trim()
      },
      groundTransportation: {
        ...value.groundTransportation,
        arrivalPickupContact: value.groundTransportation.arrivalPickupContact.trim(),
        arrivalPickupPhone: value.groundTransportation.arrivalPickupPhone.trim(),
        arrivalPickupInstructions: value.groundTransportation.arrivalPickupInstructions.trim(),
        localTransportationDetails: value.groundTransportation.localTransportationDetails.trim(),
        departurePickupContact: value.groundTransportation.departurePickupContact.trim(),
        departurePickupPhone: value.groundTransportation.departurePickupPhone.trim(),
        departurePickupInstructions: value.groundTransportation.departurePickupInstructions.trim()
      },
      generalNotes: value.generalNotes.trim(),
      readinessPercentage: 0,
      lastUpdatedUtc: null
    };

    this.assignmentService.updateTravelItinerary(this.assignmentId, itinerary);
    this.form.markAsPristine();
    this.saved = true;
    window.setTimeout(() => this.saved = false, 2500);
  }

  requestHostDetails(): void {
    this.assignmentService.requestHostCoordination(this.assignmentId);
  }

  markHostDetailsReviewed(): void {
    this.assignmentService.reviewHostCoordination(this.assignmentId);
  }

  private flightGroup() {
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

  private buildFlight(
    type: 'outbound' | 'return',
    flight: FlightFormValue
  ): AssignmentFlight {
    return {
      type,
      airline: flight.airline.trim(),
      flightNumber: flight.flightNumber.trim().toUpperCase(),
      confirmationNumber: flight.confirmationNumber.trim().toUpperCase(),
      departureAirport: flight.departureAirport.trim().toUpperCase(),
      arrivalAirport: flight.arrivalAirport.trim().toUpperCase(),
      departureDate: flight.departureDate,
      departureTime: flight.departureTime,
      arrivalDate: flight.arrivalDate,
      arrivalTime: flight.arrivalTime,
      seat: flight.seat.trim().toUpperCase(),
      notes: flight.notes.trim()
    };
  }
}
