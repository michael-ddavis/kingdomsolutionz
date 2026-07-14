# KingdomSolutionz Public Design Language v2

This package contains the first public-site redesign pass for the current Angular application.

## Replace these files

- `KingdomSolutionz.Web/ClientApp/src/styles.scss`
- `KingdomSolutionz.Web/ClientApp/src/app/app.component.html`
- `KingdomSolutionz.Web/ClientApp/src/app/app.component.scss`
- `KingdomSolutionz.Web/ClientApp/src/app/pages/home/home.component.html`

No TypeScript changes are required for this pass.

## Design decisions

- Primary typeface: Manrope
- Warm alabaster canvas rather than a cold gray background
- Deep navy for authority and primary actions
- Cobalt, violet, and gold used sparingly as brand accents
- 10–20px radii instead of pill-shaped controls throughout
- Borders and spacing provide structure; shadows are used selectively
- Homepage positioning expands from website packages to digital presence, ministry infrastructure, and technical partnership
- KingdomOS is introduced as a product in development without presenting it as complete

## Notes

The font is currently loaded through Google Fonts at the top of `styles.scss`. For stronger performance later, self-host the approved Manrope `.woff2` files in the application and replace the `@import` with local `@font-face` declarations. Do not commit font files unless their license permits redistribution.
