## Context

The existing import screen is route-scoped to a training-program ID. Storage uses that program to validate `training_code`, assign trainees, authorize import approval, and issue certificates. Certificate list, template selection, spreadsheet parsing, certificate preview, import history, and verification URLs already exist. See proposal.md and the delta specifications for the intended behavior.

## Goals / Non-Goals

**Goals:**
- Replace the program-scoped import route with a certificate-list upload entry point and a direct import flow.
- Preserve selected-template validation, spreadsheet size and row limits, import records, certificate verification, and unique identifiers.
- Remove training-program data and all active dependencies on it.

**Non-Goals:**
- Change certificate-template creation, public verification, or certificate revocation.
- Add server-side persistence, asynchronous jobs, or a new approval process.

## Decisions

### Direct import is template-scoped
The direct-import screen will load active templates, require one selection, then parse the spreadsheet and validate recipient fields plus placeholders extracted from the selected template. It will be linked from the certificate list instead of embedded in the table, retaining a dedicated preview and error surface.

Embedding this flow into the list was considered, but a separate screen avoids combining a large validation table and certificate list state while still making upload discoverable where certificates are managed.

### Generate certificates without trainees or approvals
Direct generation will construct certificate records from validated import rows, selected-template data, and the existing ID and verification helpers. Import batches will be marked completed after generation, and audit logs will record the import. Generation will be disabled until all rows are valid.

Reusing `approveImport` was considered, but it is coupled to program authorization, completed-program state, trainees, and program-level approvers. Refactoring it into an independent issuance path removes that coupling more clearly.

### Remove retired model fields and local storage
Training-program pages, routes, type definitions, storage methods, demo records, and navigation will be removed. The storage migration will delete the retired training-program and trainee keys and discard obsolete program-related fields from active import records and certificates when read or written. Existing certificates will remain accessible using their certificate-level fields.

Keeping retired fields for compatibility was considered, but it would leave active code and persisted data tied to an intentionally removed feature.

### Simplify import-facing views
Import history will replace its training-program column with template information. Import approval routes and pages will be removed because direct imports generate immediately after validation rather than wait for program-authorized approval.

## Risks / Trade-offs

- [Existing local imports reference retired programs] -> Migrate read data to remove retired fields and retain only direct-import metadata needed by the remaining views.
- [Old certificate records contain retired associations] -> Ignore and remove those optional associations while preserving certificate identity, status, template, and verification data.
- [A template requires fields absent from the spreadsheet] -> Keep row-level template-key validation and block generation until every row validates.
- [Removing approval views changes the authorization model] -> Direct generation remains available through the existing protected administrative application; no new role model is introduced.

## Migration Plan

1. Deploy the direct import path and remove retired routes and navigation.
2. On storage initialization, clear training-program and trainee records and migrate active records away from retired fields.
3. Retain existing certificates, templates, import batch metadata, and audit logs where their remaining fields are valid.
4. Roll back by restoring the prior client release; the retired local storage records cannot be reconstructed after migration.