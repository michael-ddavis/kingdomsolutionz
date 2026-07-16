import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  Assignment,
  AssignmentFlight
} from '../../../shared/models/assignment.model';

@Component({
  standalone: false,
  selector:
    'app-assignment-travel-quick-view',

  templateUrl:
    './assignment-travel-quick-view.component.html',

  styleUrls: [
    './assignment-travel-quick-view.component.scss'
  ]
})
export class AssignmentTravelQuickViewComponent {
  @Input() assignment!: Assignment;

  @Output() openFull =
    new EventEmitter<void>();

  getFlightRoute(
    flight: AssignmentFlight
  ): string {
    const departure =
      flight.departureAirport.trim() ||
      'Departure not set';

    const arrival =
      flight.arrivalAirport.trim() ||
      'Arrival not set';

    return `${departure} → ${arrival}`;
  }

  getFlightName(
    flight: AssignmentFlight
  ): string {
    const parts = [
      flight.airline.trim(),
      flight.flightNumber.trim()
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(' ')
      : 'Flight not confirmed';
  }

  hasValue(
    value: string | null | undefined
  ): boolean {
    return Boolean(value?.trim());
  }
}
