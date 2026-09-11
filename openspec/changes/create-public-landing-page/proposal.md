## Why

The application currently sends visitors at `/` directly into the authenticated admin experience, which gives new or unauthenticated users no clear introduction to the product. A public landing page will make the product purpose and main workflows understandable before users sign in, using the pick line "Design once, use indefinitely."

## What Changes

- Add a public landing page at `/` with the pick line "Design once, use indefinitely."
- Explain the core product features: reusable document templates, spreadsheet-based document generation, approval and signature workflows, and QR-backed document verification.
- Provide clear calls to action into the existing sign-in flow and public document verification flow.
- Preserve the authenticated admin experience under `/dashboard` and its existing routes.
- Ensure unauthenticated visitors can view the landing page without being redirected to login.

## Capabilities

### New Capabilities

- `public-landing-page`: Public product introduction and navigation at the root route.

### Modified Capabilities

<!-- No existing capability requirements are changed. -->

## Impact

- React routing in `src/App.tsx` and a new or updated page component for the public root route.
- Shared styling and visual assets in `src/index.css` and `public/assets/` as needed.
- Existing authentication and verification routes must remain compatible.
- No API, storage, or database changes are expected.