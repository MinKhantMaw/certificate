## Why

The document platform's client-side workflows need to move into another system, but the migration must preserve the existing product behavior without expanding scope into backend services, API contracts, authentication, or login. A focused migration plan will give another agent a reliable map of the existing templates, imports, documents, approvals, QR behavior, and client persistence boundaries.

## What Changes

- Migrate the client-side document platform into the target system's existing frontend, routing, state, persistence, and authentication context.
- Preserve template creation/editing, dynamic layout fields, background assets, sample spreadsheet downloads, and template-reference deletion protection.
- Preserve direct Excel issuance, including template selection, `.xlsx`/`.xls` parsing, 10 MB and 5,000-row limits, template-defined validation, paginated preview, and all-valid generation.
- Preserve document numbering, short IDs, verification tokens, dynamic data, previews, list/detail views, search, sorting, filtering, image download, printing, revoke, deletion, audit records, and verification tombstones.
- Preserve pending-document approval, signer metadata, signature profile behavior, and template-driven QR rendering.
- Preserve the public landing and document-verification views while reusing the target system's existing sign-in destination and client-side document source.
- Migrate legacy client data only when required, including certificate-named fields and retired training-program relationships, with idempotent mapping and no data loss by silent omission.
- **BREAKING** Do not add backend persistence, API routes, database schemas, server-side asset storage, authentication, login, or session creation as part of this migration.

## Capabilities

### New Capabilities

None. This change transfers existing client-side behavior and does not introduce a new user-facing capability.

### Modified Capabilities

None. Existing OpenSpec capabilities already define the behavior being preserved. Specs are intentionally skipped for this implementation-only migration.

## Impact

- Affected client routes, components, pages, hooks, utilities, tests, and client-side storage/state adapters.
- Primary source areas include template authoring, document preview, direct Excel import, document list/detail, approvals, signatures, verification, and storage helpers.
- The target system's existing authentication context remains an external dependency and must not be modified.
- No new backend, API, database, or server infrastructure is required.
