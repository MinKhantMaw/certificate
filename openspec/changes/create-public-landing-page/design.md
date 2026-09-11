## Context

The current React Router configuration places `/` inside the protected `AdminLayout` route and redirects its index to `/dashboard`. The project already uses React, Tailwind CSS, Poppins, and `lucide-react`; the login page provides the existing visual and navigation conventions. See `proposal.md` for the motivation and `specs/public-landing-page/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Make `/` a responsive, public product introduction with a strong hero message using the exact pick line.
- Explain the four primary workflows in scannable feature sections with familiar icons.
- Link sign-in to `/login`, keep verification discoverable, and preserve direct `/dashboard` and `/verify/:verificationToken` behavior.
- Keep the page consistent with the existing Poppins, Tailwind, blue-accent visual system and avoid adding a new dependency.

**Non-Goals:**

- No changes to authentication, document generation, approval, signature, verification, storage, or API behavior.
- No replacement of the existing dashboard layout or login form.
- No new CMS, marketing content system, or server-rendered page.

## Decisions

- **Use a dedicated public page component for `/`.** Move the root index route outside the protected admin route and render the page directly; keep the current admin route hierarchy available at `/dashboard` and below. This is preferable to making `ProtectedRoute` understand a public exception because the route boundary remains explicit and avoids weakening the guard.
- **Use in-app navigation for known routes.** Use React Router links for `/login` and the verification entry point so navigation stays client-side. Preserve the token verification route unchanged; if no standalone verification entry route exists, the design should expose the existing verification URL convention without inventing authentication behavior.
- **Use existing Tailwind tokens and Lucide icons.** Build the visual hierarchy with the current Poppins font, blue accent, neutral surfaces, responsive grid/flex utilities, and icons already used elsewhere. This keeps the landing page cohesive and avoids a dependency or design-system migration.
- **Keep content static in the first version.** Feature descriptions are product copy, not user data, so local component data is sufficient and avoids introducing a content API or state model.

## Risks / Trade-offs

- [Risk] Moving `/` out of the protected route could expose an unintended admin child route if route nesting is changed incorrectly -> Keep the protected route rooted at `/dashboard` and test both unauthenticated `/` and authenticated `/dashboard` navigation.
- [Risk] The feature copy may imply capabilities beyond the current implementation -> Limit descriptions to the existing template, import, approval/signature, and verification workflows represented in the application.
- [Risk] A rich responsive layout can regress on narrow screens -> Define responsive layout breakpoints and verify the page at desktop and mobile viewport sizes during implementation.

## Migration Plan

1. Add the public landing page component and update route registration.
2. Add focused route/page tests for public root access, required copy, and preserved destinations.
3. Build and run the existing test suite before deployment.
4. Roll back by restoring the current root index redirect if the landing page causes a navigation or authentication regression.