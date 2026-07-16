# KingdomSolutionz

KingdomSolutionz is an ASP.NET Core and Angular application containing the public KingdomSolutionz website, project-intake flow, and the KingdomOS ministry-operations prototype.

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
- `/app/login` — KingdomOS demonstration entry
- `/app` — KingdomOS workspace prototype

## KingdomOS design foundation

Shared platform tokens and primitives live in:

- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-tokens.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-foundation.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-motion.scss`
- `KingdomSolutionz.Web/ClientApp/src/styles/_kos-responsive.scss`

New platform UI should use these shared values before introducing component-specific colors, type sizes, spacing, controls, or focus treatments.

The authenticated KingdomOS interface uses the **Quiet Authority** direction: obsidian navigation and primary actions, warm ivory work surfaces, restrained champagne accents, and functional status colors reserved for operational meaning. The public KingdomSolutionz site and invitation intake remain visually independent.

## Prototype limitations

KingdomOS is currently a product demonstration, not a production tenant application:

- the KingdomOS login does not authenticate a user;
- assignments, speaking requests, workspaces, travel details, and activity are stored in browser memory;
- document uploads use temporary browser object URLs;
- refreshing the page resets demonstration data;
- administrative lead endpoints must be protected before production use.

Authentication, authorization, durable APIs, database migrations, and document storage are required before onboarding real KingdomOS users.

## Validation and deployment

Pull-request validation installs dependencies, audits production packages, builds Angular, runs browser tests, and builds the .NET application. Pushes to `main` publish the application to the configured Azure Web App.

The public site currently loads Manrope through Google Fonts. Self-host approved `.woff2` files before a performance-focused production release.
