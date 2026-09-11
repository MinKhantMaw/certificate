## 1. Public Route Structure

- [x] 1.1 Add a dedicated public landing page component and register it at `/`, verifying an unauthenticated visit renders the page without the protected-route redirect.
- [x] 1.2 Move or preserve the protected admin route boundary so `/dashboard` and existing admin child routes remain authenticated, verifying an authenticated dashboard visit still renders the current dashboard.

## 2. Landing Page Experience

- [x] 2.1 Build the responsive landing page hero with the exact text "Design once, use indefinitely" and a sign-in action targeting `/login`, verifying the copy and destination are present in the rendered page.
- [x] 2.2 Add scannable feature sections for reusable templates, spreadsheet-based generation, approval and signature workflows, and QR-backed verification using existing Tailwind and Lucide conventions, verifying each feature has visible explanatory text at desktop and mobile widths.
- [x] 2.3 Add a clear path toward the existing public document verification flow without changing token verification behavior, verifying the link does not require admin authentication.

## 3. Verification

- [x] 3.1 Add or update focused page and route tests for public root access, required pick-line and feature copy, sign-in navigation, and preservation of `/verify/:verificationToken` behavior, verifying the focused test command passes.
- [x] 3.2 Run the project typecheck/build and full test suite, verifying no new TypeScript, routing, or regression failures are introduced.