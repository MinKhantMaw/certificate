## Context

The source application is a React client with route-level pages, shared document/template types, a storage service backed primarily by browser state, and focused utilities for layout validation, template-key resolution, spreadsheet parsing, identifier generation, and sample workbook creation. The existing OpenSpec capabilities define the behavior to preserve; see proposal.md for the migration motivation and scope.

The target system is a React 18 application using React Router 6, MUI, dnd-kit, React Hook Form/Yup, `xlsx`, React PDF, `qrcode.react`, and `html2canvas`. Its existing frontend runtime, routing, client-side persistence, and authentication context are the integration boundary. The migration must not introduce backend services, API routes, database schemas, server asset storage, authentication, or login.

## Goals / Non-Goals

**Goals:**

- Recreate the platform's client-side workflows using the target system's established component, routing, state, and persistence patterns.
- Keep the domain model and behavior stable while isolating target-specific adapters from document and template logic.
- Preserve template-driven rendering, direct spreadsheet issuance, document lifecycle actions, approval/signature behavior, QR gating, public verification views, and client-data migration behavior.
- Make client-side state updates consistent for generation, template deletion protection, approval finalization, document deletion, audits, and verification tombstones.
- Keep the existing authentication/session context injectable and read-only from the migrated feature.

**Non-Goals:**

- Adding or changing login, authentication, authorization configuration, session creation, or user provisioning.
- Adding backend persistence, API contracts, database models, server-side file storage, background jobs, or deployment infrastructure.
- Changing the current user-facing requirements or approval policy: direct imports remain immediately `VALID`, while pending documents use the existing approval path.
- Replacing the target system's existing UI design system or unrelated routing and application state.

## Decisions

### Keep a target-neutral client domain layer

Define or port pure client types and utilities for templates, layouts, documents, imports, approvals, signatures, audits, and verification. Keep spreadsheet parsing, template-key normalization, value resolution, identifier generation, layout validation, and display-field derivation independent from React components.

Alternative: copy page components first and adapt behavior inline. Rejected because it would couple business rules to the target UI and make it easy for list, detail, preview, and import flows to resolve dynamic fields differently.

### Use an adapter around existing target state and persistence

Create a narrow client service interface equivalent to the source `storage` surface. The adapter reads and writes the target system's existing client-side state and receives the current user/role from the existing auth context. Generation, approval finalization, deletion, and audit/tombstone updates should be grouped into one state transition where the target store supports it.

Alternative: retain the source localStorage keys and service unchanged. Rejected because the target system may use a different state mechanism and the migration should not leak source-specific storage names into the new application.

### Use the target UI and utility stack

Use MUI components and icons for the administrative surfaces, dnd-kit for template element manipulation where drag-and-drop is needed, React Hook Form with Yup for template and profile forms, `xlsx` for workbook parsing and generation, React PDF for document export/preview where appropriate, `qrcode.react` for QR rendering, and `html2canvas` for image capture. Keep the source behavior and data contracts independent from these presentation choices.

Alternative: add the source Tailwind, Konva, or Vercel-specific implementation unchanged. Rejected because it would add unnecessary dependencies and conflict with the target system's established component and rendering stack.

### Preserve the template as the data contract

Derive import-required fields, sample workbook headers, document-list columns, detail rows, and rendered text values from the selected template's unique text keys in layout order. Canonical fields remain compatibility fallbacks for older documents but are not independently required when absent from the selected template.

Alternative: impose one global document schema on every import. Rejected because the existing product supports different document shapes per template and explicitly accepts rows without unconfigured canonical fields.

### Preserve document lifecycle invariants in client services

Keep active-template enforcement, all-valid-row generation, unique document numbers/short IDs/tokens, template-reference deletion protection, approval cleanup, deletion audits, and deleted-token tombstones in the service boundary rather than only in page components.

Alternative: implement guards only in individual pages. Rejected because future client callers could bypass them and leave state inconsistent.

### Reuse existing client-side asset and QR boundaries

Port background/signature handling to the target system's existing client-side asset mechanism. Preserve the rule that QR rendering and print readiness depend on the selected template containing a QR element. If the target has no encrypted-QR integration, use its existing client integration or a client-side QR representation without adding a new server dependency.

Alternative: recreate the source filesystem upload and external QR API assumptions. Rejected because both are outside the migration scope and are not portable client contracts.

### Migrate legacy records defensively and idempotently

If source browser data must be carried over, transform certificate-named fields to document-named fields, remove retired training-program relationships, preserve tokens and dynamic data, and mark the migration complete only after the transformed state is written. Prefer already-migrated document state and retain a report for records that cannot be mapped.

Alternative: clear old storage and seed fresh demo data. Rejected because it loses issued-document history and invalidates existing verification links.

### Stage the migration by vertical workflow

Implement and validate in this order: target adapter and domain utilities; template authoring/rendering; direct import and generation; document list/detail/lifecycle; approvals/signatures; public landing/verification; then full regression and migration checks. Each stage should be usable and testable before the next begins.

Alternative: perform a broad mechanical file migration first. Rejected because it would obscure which behavior failed and would make target-specific integration issues harder to isolate.

## Risks / Trade-offs

- [The target application uses React 18 but has different state/persistence conventions] -> Resolve the adapter against the existing target store/context in Phase 0 and keep domain utilities framework-neutral.
- [Client-side persistence can lose or corrupt multi-step updates] -> Centralize state transitions, validate before writes, write generation batches together where possible, and make migrations idempotent.
- [Template edits can change how existing documents render] -> Keep the existing template reference and dynamic data, surface missing-template/value states, and add regression fixtures for legacy documents.
- [Large workbooks can block the browser] -> Preserve the 10 MB and 5,000-row limits, parse in a controlled workflow, paginate preview rows, and avoid rendering all rows at once.
- [Approval navigation is currently hidden while approval components still exist] -> Preserve the existing pending-document behavior and make any navigation exposure an explicit separate decision.
- [Source assets or encrypted QR behavior may not have a target equivalent] -> Keep asset/QR integration behind small client adapters and provide actionable unavailable states without adding backend work.
- [Legacy certificate and training-program records may be inconsistent] -> Map only known fields, preserve unmapped data for review, and verify counts/tokens before clearing or replacing source state.

## Migration Plan

1. Inventory the target frontend, routing, state/persistence, asset handling, and existing auth context; record the adapter contracts without changing login or auth.
2. Port pure domain types/utilities and create the target client storage/state adapter with focused tests.
3. Port template creation/detail/editor, layout validation, assets, preview rendering, and sample workbook generation.
4. Port direct Excel import, selected-template validation, paginated preview, document generation, import history, and client-side audit updates.
5. Port document list/detail, dynamic fields, image/print actions, revoke, deletion cleanup, and verification tombstones.
6. Port pending approvals, signature profile behavior, template-driven QR rendering, public landing, and public verification views.
7. Run focused tests after each vertical workflow, then run the complete client test suite, typecheck/lint, production build, and end-to-end smoke flow.
8. If legacy state is in scope, run an idempotent migration in a backup-preserving mode, compare document/template counts and verification tokens, then enable the migrated views.
9. Roll back by disabling the migrated routes/components and restoring the target system's previous client state snapshot; do not delete source records during rollout.

## Resolved Assumptions

- The target UI uses React 18, React Router 6, MUI, and the dependency set listed in the migration request.
- Existing target client state/persistence and authentication context are reused; their internal implementation is not changed.
- Existing records should be migrated when present; the migration must also support an empty target store.
- Asset handling uses the target's existing client-side mechanism. QR rendering uses `qrcode.react`; any encrypted-link behavior is consumed only through an existing client integration and is not recreated as a new service.
