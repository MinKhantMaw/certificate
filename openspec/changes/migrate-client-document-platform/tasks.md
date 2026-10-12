## 1. Target Integration and Domain Layer

- [ ] 1.1 Inventory the target React 18 routes, state/persistence mechanism, asset handling, and current user/role context, then record the adapter entry points and verify no login or authentication files are included in the migration scope.
- [ ] 1.2 Port the document-platform types and pure utilities for templates, layouts, documents, imports, approvals, audits, identifiers, template-key extraction, value resolution, and verification tokens, then verify the target TypeScript check passes.
- [ ] 1.3 Implement the client document service adapter against the target system's existing state/persistence mechanism, including template CRUD, document CRUD, import batches, approvals, audit entries, and deletion tombstones; verify focused service tests pass without source-specific storage keys.
- [ ] 1.4 Add idempotent legacy client-data mapping for certificate-named fields and retired training-program relationships, preserving document identifiers, verification tokens, dynamic data, and unmapped-record diagnostics; verify repeated migration runs produce the same target state.

## 2. Template Authoring and Rendering

- [ ] 2.1 Port template layout validation for canvas dimensions, unique element IDs, text keys, signature references, supported element types, and valid page settings; verify invalid layouts are rejected by focused unit tests.
- [ ] 2.2 Rebuild template create/detail/edit screens with MUI forms and React Hook Form/Yup while preserving existing route behavior, status, dynamic-field display, and guarded deletion; verify create, edit, missing-template, and referenced-template deletion scenarios.
- [ ] 2.3 Rebuild the template canvas editor with dnd-kit for element movement/sorting and the existing target UI primitives for text, image, signature, QR, shape, and plain-text elements; verify drag, resize/reorder, selection, alignment, and validated save behavior.
- [ ] 2.4 Port background and signature asset handling through the target's existing client-side asset mechanism with the existing file-type and size constraints; verify valid uploads, invalid files, removal, and unavailable-asset states.
- [ ] 2.5 Rebuild document rendering and preview using the target stack, resolving dynamic values case-insensitively with canonical fallbacks and rendering QR only for layouts containing QR elements; verify text, image, signature, shape, QR, missing-template, and missing-value fixtures.
- [ ] 2.6 Port template-specific sample workbook generation with `xlsx`, including unique headers in layout order, one worksheet, no recipient rows, and sanitized filenames; verify read-back headers and empty-layout behavior.

## 3. Direct Excel Issuance

- [ ] 3.1 Rebuild the template-scoped import route and MUI upload flow, requiring an active template before file processing and preserving the no-active-template state; verify upload is blocked until a valid active template is selected.
- [ ] 3.2 Port `.xlsx`/`.xls` parsing with `xlsx`, first-sheet selection, normalized headers, 10 MB file limit, 5,000-row limit, and empty/unsupported-file errors; verify focused parser tests for each boundary.
- [ ] 3.3 Port selected-template row validation so only configured template fields are required and unconfigured canonical fields are not format-checked or deduplicated; verify valid rows, missing fields, duplicate keys, and legacy header aliases.
- [ ] 3.4 Build the paginated import preview with row validity, dynamic values, validation errors, and a first-row document preview; verify every parsed row is represented and generation remains disabled when any row is invalid.
- [ ] 3.5 Implement client-side document generation for all-valid rows, preserving document numbers, unique short IDs/checksums, verification tokens/URLs, defaults, dynamic data, template references, timestamps, and audit updates; verify generated documents are unique and contain no training-program fields.
- [ ] 3.6 Persist completed import batches only after successful generation and make repeated submission safe against duplicate client-side documents/batches; verify successful, failed, and retry scenarios with focused service tests.
- [ ] 3.7 Rebuild import history using file, template, row counts, status, and submission time without training-program columns; verify completed direct imports render correctly.

## 4. Document Management and Lifecycle

- [ ] 4.1 Rebuild the document list with active-template selection, template filtering, template-defined dynamic columns, readable labels, search, sorting, status filtering, pagination, table/slide views, and upload navigation; verify list behavior for multiple templates and missing dynamic values.
- [ ] 4.2 Rebuild document detail with template-defined information rows, canonical fallbacks, stable empty markers, preview, verification link, QR readiness, image download through `html2canvas`, and print/export through the target PDF/image stack; verify missing-template and no-QR behavior.
- [ ] 4.3 Port revoke behavior and status rendering for valid, pending, rejected, and revoked documents; verify confirmation, state update, and list/detail refresh behavior.
- [ ] 4.4 Port explicit document deletion from list and detail, removing related approvals, preserving a deletion audit entry, writing a verification tombstone, and returning to the list after detail deletion; verify cancellation, success, unknown-ID failure, and unrelated-document preservation.

## 5. Approvals, Signatures, and QR

- [ ] 5.1 Rebuild the pending approval view using the target role context without changing login or role provisioning; verify only the current approver's pending records are actionable.
- [ ] 5.2 Port approve/reject transitions, signer metadata capture, closure of other pending records, and audit updates while keeping direct-import documents immediately `VALID`; verify first-decision-wins behavior and rejected-document state.
- [ ] 5.3 Rebuild the signature profile UI for PNG/JPEG upload, replacement, removal, and signer preview using the target client asset mechanism; verify persisted profile updates are reflected in approval rendering.
- [ ] 5.4 Implement template-driven QR rendering with `qrcode.react` and the target's existing client QR/encrypted-link integration when available; verify QR appears only for QR elements and print/download waits only when QR preparation is required.

## 6. Public Client Views and Routes

- [ ] 6.1 Port the public landing page at `/` with the exact line `Design once, use indefinitely`, feature explanations, and links to the existing sign-in destination and verification entry point; verify unauthenticated access without modifying login.
- [ ] 6.2 Port public document verification from the target system's client-side document state or fixture mechanism, including valid, revoked, pending, invalid, deleted-token, and unknown-token states; verify no new API or backend dependency is introduced.
- [ ] 6.3 Preserve document-named routes and remove active certificate-named route/identifier usage while keeping the target system's existing protected-route boundary intact; verify public routes remain accessible and admin routes still receive the existing auth context.

## 7. Regression and Migration Validation

- [ ] 7.1 Port unit and service tests for key normalization, layout validation, workbook generation, spreadsheet limits, row validation, identifiers, QR gating, generation, approvals, deletion cleanup, tombstones, and legacy mapping; verify the focused test suite passes.
- [ ] 7.2 Add component/browser tests for template authoring, import selection/preview/generation, dynamic list/detail, approvals/signatures, deletion confirmations, QR readiness, landing, and verification states at mobile and desktop widths; verify the target test runner passes.
- [ ] 7.3 Run the complete target lint/typecheck, test suite, and production build; verify no backend, API, authentication, or login changes are present in the migration diff.
- [ ] 7.4 Execute the seeded end-to-end flow: create template -> upload asset -> download sample -> upload workbook -> preview -> generate -> view -> verify -> approve/revoke/delete as applicable; verify counts, identifiers, dynamic data, QR behavior, audit entries, and tombstones.
- [ ] 7.5 Run the legacy migration in backup-preserving mode when source records exist, compare template/document counts and verification tokens, verify idempotence, and document any unmapped records before rollout.
