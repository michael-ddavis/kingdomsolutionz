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
  AssignmentFlight,
  AssignmentGroundTransportation,
  AssignmentHotel,
  AssignmentTravelItinerary
} from '../../../shared/models/assignment.model';

import {
  AssignmentService
} from '../../../shared/services/assignment.service';

type FlightFormValue =
  Omit<AssignmentFlight, 'type'>;

@Component({
  standalone: false,
  selector: 'app-assignment-travel',
  templateUrl:
    './assignment-travel.component.html',
  styleUrls: [
    './assignment-travel.component.scss'
  ]
})
export class AssignmentTravelComponent
  implements OnInit {
  private readonly assignmentId =
    Number(
      this.route.parent
        ?.snapshot.paramMap.get('id')
    );

  saved = false;

  transportContactPrefilled = false;

  readonly assignment$:
    Observable<Assignment | undefined> =
      this.assignmentService.getAssignment(
        this.assignmentId
      );

  readonly form =
    this.formBuilder.nonNullable.group({
      outboundFlight:
        this.formBuilder.nonNullable.group({
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
        }),

      returnFlight:
        this.formBuilder.nonNullable.group({
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
        }),

      hotel:
        this.formBuilder.nonNullable.group({
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

      groundTransportation:
        this.formBuilder.nonNullable.group({
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
        const itinerary =
          assignment.travelItinerary;

        const transportation =
          itinerary.groundTransportation;

        const travelContact =
          assignment.contactDirectory
            .travelContact;

        const groundTransportation = {
          ...transportation,

          arrivalPickupContact:
            transportation
              .arrivalPickupContact ||
            travelContact.name,

          arrivalPickupPhone:
            transportation
              .arrivalPickupPhone ||
            travelContact.phone,

          departurePickupContact:
            transportation
              .departurePickupContact ||
            travelContact.name,

          departurePickupPhone:
            transportation
              .departurePickupPhone ||
            travelContact.phone
        };

        this.transportContactPrefilled =
          groundTransportation
            .arrivalPickupContact !==
            transportation
              .arrivalPickupContact ||
          groundTransportation
            .arrivalPickupPhone !==
            transportation
              .arrivalPickupPhone ||
          groundTransportation
            .departurePickupContact !==
            transportation
              .departurePickupContact ||
          groundTransportation
            .departurePickupPhone !==
            transportation
              .departurePickupPhone;

        this.form.patchValue({
          outboundFlight:
            itinerary.outboundFlight,

          returnFlight:
            itinerary.returnFlight,

          hotel:
            itinerary.hotel,

          groundTransportation:
            groundTransportation,

          generalNotes:
            itinerary.generalNotes
        });
      });
  }

  saveItinerary(): void {
    const value =
      this.form.getRawValue();

    const itinerary:
      AssignmentTravelItinerary = {
        outboundFlight:
          this.buildFlight(
            'outbound',
            value.outboundFlight
          ),

        returnFlight:
          this.buildFlight(
            'return',
            value.returnFlight
          ),

        hotel: {
          ...value.hotel,

          hotelName:
            value.hotel.hotelName.trim(),

          confirmationNumber:
            value.hotel.confirmationNumber
              .trim()
              .toUpperCase(),

          address:
            value.hotel.address.trim(),

          city:
            value.hotel.city.trim(),

          state:
            value.hotel.state
              .trim()
              .toUpperCase(),

          postalCode:
            value.hotel.postalCode.trim(),

          phone:
            value.hotel.phone.trim(),

          notes:
            value.hotel.notes.trim()
        },

        groundTransportation: {
          ...value.groundTransportation,

          arrivalPickupContact:
            value.groundTransportation
              .arrivalPickupContact
              .trim(),

          arrivalPickupPhone:
            value.groundTransportation
              .arrivalPickupPhone
              .trim(),

          arrivalPickupInstructions:
            value.groundTransportation
              .arrivalPickupInstructions
              .trim(),

          localTransportationDetails:
            value.groundTransportation
              .localTransportationDetails
              .trim(),

          departurePickupContact:
            value.groundTransportation
              .departurePickupContact
              .trim(),

          departurePickupPhone:
            value.groundTransportation
              .departurePickupPhone
              .trim(),

          departurePickupInstructions:
            value.groundTransportation
              .departurePickupInstructions
              .trim()
        },

        generalNotes:
          value.generalNotes.trim(),

        readinessPercentage: 0,
        lastUpdatedUtc: null
      };

    this.assignmentService
      .updateTravelItinerary(
        this.assignmentId,
        itinerary
      );

    this.form.markAsPristine();
    this.saved = true;

    window.setTimeout(() => {
      this.saved = false;
    }, 2500);
  }

  isFlightComplete(
    flight: AssignmentFlight
  ): boolean {
    return Boolean(
      flight.airline.trim() &&
      flight.flightNumber.trim() &&
      flight.confirmationNumber.trim() &&
      flight.departureAirport.trim() &&
      flight.arrivalAirport.trim() &&
      flight.departureDate &&
      flight.departureTime &&
      flight.arrivalDate &&
      flight.arrivalTime
    );
  }

  isHotelComplete(
    hotel: AssignmentHotel
  ): boolean {
    return Boolean(
      hotel.hotelName.trim() &&
      hotel.confirmationNumber.trim() &&
      hotel.address.trim() &&
      hotel.city.trim() &&
      hotel.state.trim() &&
      hotel.checkInDate &&
      hotel.checkOutDate
    );
  }

  isArrivalPickupComplete(
    transportation:
      AssignmentGroundTransportation
  ): boolean {
    return Boolean(
      transportation
        .arrivalPickupContact
        .trim() &&
      transportation
        .arrivalPickupPhone
        .trim() &&
      transportation
        .arrivalPickupInstructions
        .trim()
    );
  }

  isDeparturePickupComplete(
    transportation:
      AssignmentGroundTransportation
  ): boolean {
    return Boolean(
      transportation
        .departurePickupContact
        .trim() &&
      transportation
        .departurePickupPhone
        .trim() &&
      transportation
        .departurePickupInstructions
        .trim()
    );
  }

  private buildFlight(
    type: 'outbound' | 'return',
    flight: FlightFormValue
  ): AssignmentFlight {
    return {
      type,

      airline:
        flight.airline.trim(),

      flightNumber:
        flight.flightNumber
          .trim()
          .toUpperCase(),

      confirmationNumber:
        flight.confirmationNumber
          .trim()
          .toUpperCase(),

      departureAirport:
        flight.departureAirport
          .trim()
          .toUpperCase(),

      arrivalAirport:
        flight.arrivalAirport
          .trim()
          .toUpperCase(),

      departureDate:
        flight.departureDate,

      departureTime:
        flight.departureTime,

      arrivalDate:
        flight.arrivalDate,

      arrivalTime:
        flight.arrivalTime,

      seat:
        flight.seat
          .trim()
          .toUpperCase(),

      notes:
        flight.notes.trim()
    };
  }
}
