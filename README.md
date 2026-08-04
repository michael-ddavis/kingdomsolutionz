# KingdomSolutionz Public Website

This repository owns the public KingdomSolutionz website: marketing pages, portfolio, services, pricing, project intake, contact, and public lead capture.

It does **not** host a KingdomOS product module. Internal product capabilities belong in their own repositories:

- Kingdom Platform owns the control plane, module catalog, entitlements, and shared identity.
- Kingdom Operations owns ministry workspaces, assignments, checklists, support, and organization-wide oversight.
- Kingdom Engagements owns approved assignment intake, host coordination, travel, lodging, transportation, documents, readiness, and closeout.
- Kingdom LIVE, Academy, Care, Missions, People, Impact, and Intelligence retain their own domain boundaries.

The public website may link to a KingdomOS sign-in or product landing page, but it must not contain internal module routes, entitlement middleware, product databases, or operational workflow code.

## Local development

Run the ASP.NET host from `KingdomSolutionz.Web`. The Angular application is served as the public site and the API is limited to public-site concerns such as lead intake.

## Boundary guard

`node scripts/verify-public-site.mjs` fails if internal KingdomOS module code or routes are added to this repository.
