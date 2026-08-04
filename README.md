# Kingdom Engagements

This repository contains the public KingdomSolutionz site and the complete Kingdom Engagements product for speaking and ministry invitations.

## Product boundary

Kingdom Engagements owns the full engagement lifecycle:

- public speaking-request intake and host corrections;
- invitation review, approval and assignment creation;
- speaker profiles, approved biography, assets and preferences;
- host organization, venue, event and contact information;
- preparation checklists and responsibility tracking;
- host coordination links and forms;
- flights, lodging and ground transportation;
- contracts, schedules, promotional resources and documents;
- optional consented Kingdom Care handoffs when Care is entitled;
- engagement activity history, closeout, expenses and outcomes.

Kingdom Operations does not own these records. Operations may receive governed engagement status, risk or support-request summaries, but detailed engagement work remains here.

## Technology

- ASP.NET Core 8
- Angular 21
- Node.js 22.12 or another version supported by Angular 21
- SQL Server for public lead intake
- browser local storage for the current Engagements demonstration state

## Local development

```bash
cd KingdomSolutionz.Web/ClientApp
npm ci
npm start
```

Run validation:

```bash
npm run build:production
npm run test:ci
cd ../../..
dotnet build KingdomSolutionz.sln
```

## Main routes

- `/invite/apostle-cynthia` — public speaking request
- `/invite/apostle-cynthia/requests/:id/update` — host correction link
- `/coordinate/assignments/:id` — host coordination form
- `/respond/assignments/:id` — public or QR ministry-response intake
- `/app/login` — Kingdom Engagements demonstration entry
- `/app/speaking-requests` — invitation queue
- `/app/assignments` — approved engagements
- `/app/assignments/:id/travel` — flights, lodging and transportation
- `/app/speaker-profile` — reusable speaker profile and assets
- `/app/care-network` — optional Care-enabled follow-through

## Current limitations

This remains a product demonstration. Engagement state is stored in browser local storage, document uploads use browser object URLs, outbound messages are simulated, and the demo login is not production authentication. Durable APIs, database migrations, signed expiring host links, document storage and production authorization are required before live ministry onboarding.
