# KingdomSolutionz

KingdomSolutionz is an ASP.NET Core and Angular application containing the public KingdomSolutionz website, project-intake flow, and the KingdomOps ministry-operations prototype.

## Technology

- ASP.NET Core 8
- Angular 21
- Node.js 22.12 or another version supported by Angular 21
- SQL Server for public lead intake

The recommended Node version is recorded in `KingdomSolutionz.Web/ClientApp/.nvmrc`.

## Local development

Install the web dependencies:

```bash
cd KingdomSolutionz.Web/ClientApp
npm ci
```

Start the Angular development server with the API proxy:

```bash
npm start
```

Run the production web build and tests:

```bash
npm run build:production
npm run test:ci
```

Run the ASP.NET Core application from the repository root:

```bash
dotnet run --project KingdomSolutionz.Web/KingdomSolutionz.Web.csproj
```

## Application areas

- `/` — public KingdomSolutionz website
- `/start-project` — public project-intake form
- `/invite/apostle-cynthia` — public speaking-request demonstration
- `/invite/apostle-cynthia/requests/:id/update` — host correction and resubmission link
- `/coordinate/assignments/:id` — host logistics, contacts, schedule, prayer, promotion, and file intake
- `/respond/assignments/:id` — public/QR ministry-response intake
- `/app/login` — KingdomOps demonstration entry
- `/app` — KingdomOps workspace prototype
- `/app/care-network` — cross-assignment Care Inbox and reusable trusted-partner directory
- `/app/assignments/2001/care-network` — consented response intake, assigned care follow-up, trusted local partners, referral SLAs, reassignment, and accountable connection tracking
- `/app/speaker-profile` — reusable biography, assets, preferences, documents, and team contacts

## KingdomOps design foundation

Shared platform tokens and primitives live in:

- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-tokens.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-foundation.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-motion.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-responsive.scss`

New platform UI should use these shared values before introducing component-specific colors, type sizes, spacing, controls, or focus treatments.

The authenticated KingdomOps interface uses the **Quiet Authority** direction: obsidian navigation and primary actions, warm ivory work surfaces, restrained champagne accents, and functional status colors reserved for operational meaning. The public KingdomSolutionz site and invitation intake remain visually independent.

Approved speaking requests are the source record for assignment creation. Event details, dates, venue, requested ministry, attendance, coverage commitments, and the primary host contact carry into the assignment automatically. Assignment sections collect only information that was not already supplied, while preserving a link to the original invitation.

KingdomOps Care Network keeps responsibility with the ministry until a receiving partner accepts the referral. The Care Inbox brings cases from every assignment into one queue, while verified partner churches remain reusable across future assignments. Each response records consent provenance, an assigned care coordinator, priority, next follow-up, contact attempts, referral deadlines and reminders. Declined, expired, cancelled, unreachable and consent-withdrawn cases retain their history so reassignment and closure remain auditable.

## Prototype limitations

KingdomOps is currently a product demonstration, not a production tenant application:

- the KingdomOps login does not authenticate a user;
- speaking-request, assignment, and care-network state is stored in browser local storage so host links and the full demo sequence survive a refresh;
- invitation notifications and referral email delivery are simulated; a production provider and signed, expiring links are still required;
- document uploads use temporary browser object URLs;
- the Speaking Requests page includes a Reset ACT demo action that restores the single pending invitation;
- administrative lead endpoints must be protected before production use.

Authentication, authorization, durable APIs, database migrations, and document storage are required before onboarding real KingdomOps users.

## Validation and deployment

Pull-request validation installs dependencies, audits production packages, builds Angular, runs browser tests, and builds the .NET application. Pushes to `main` publish the application to the configured Azure Web App.

The public site currently loads Manrope through Google Fonts. Self-host approved `.woff2` files before a performance-focused production release.
