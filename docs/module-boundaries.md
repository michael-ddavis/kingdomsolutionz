# Kingdom Operations module boundaries

## Operations owns

- speaking invitations and the terms presented for approval
- assignment creation and operational ownership
- preparation checklists, contacts, documents, activity, and ministry outcomes
- links into separately entitled KingdomOS products

## Engagements owns

- engagement readiness after an assignment is approved
- flight and itinerary coordination
- lodging and ground transportation
- host arrival and departure details
- engagement-specific travel documents and readiness signals

Operations publishes `AssignmentApproved`. Kingdom Platform provisions the assignment
into Kingdom Engagements only when the tenant has the `engagements` entitlement.
Operations does not expose Travel navigation, routes, dashboard cards, or supported
Travel write workflows.

The local demo assignment payload still accepts legacy serialized Travel fields so an
existing browser-storage record can be read during the transition. Those fields are
migration-only compatibility data, not an Operations system of record. They should be
removed with the next persisted assignment schema migration.

## Kingdom Care is optional

Operations resolves tenant entitlements from Kingdom Platform. When `care` is not
enabled:

- Care navigation is omitted
- assignment Care tabs are omitted
- Care routes, including external referral response links, redirect to the dashboard
- Care dashboard metrics, activity, schedule items, and quick actions are omitted
- Operations fails closed if Platform entitlement data cannot be resolved

Kingdom Platform also prevents Care-targeted integration delivery while the Care
entitlement is disabled.
