## Context

The product currently mixes document-facing labels with certificate-named source identifiers, routes, local-storage keys, API payloads, and filenames. Browser data is stored under `cms_certificates`, while the verification API returns certificate-named fields. See proposal.md for the motivation and the delta specs for behavior changes.

## Goals / Non-Goals

**Goals:**
- Establish `document` as the only product and codebase term for issued records.
- Move all document-management routes to document-named paths.
- Preserve existing browser-stored records through a one-time migration.
- Keep verification tokens and public verification functionality working after the rename.

**Non-Goals:**
- Change the document issuance workflow, document content, or verification security model.
- Retain certificate-named public API fields or routes as long-term aliases.

## Decisions

### Rename the complete domain vocabulary
Rename `Certificate`, `CertificateTemplate`, and `CertificateApproval` types; properties such as `certificateNumber`; components; helpers; hooks; source files; storage methods; tests; and server variables to document-named equivalents. Rename the user-facing title text in every page, including public verification.

Keeping internal certificate identifiers was considered, but mixed internal and external terminology would violate the requested full rename and create a permanent translation layer.

### Replace routes without retaining aliases
Use document-named paths for list, detail, and template management. The generic `/verify/:verificationToken` route remains unchanged because it contains neither the retired term nor a resource-specific contract. Certificate-named routes are removed rather than redirected.

Maintaining redirects was considered, but this migration explicitly changes every route naming and does not require external backward compatibility.

### Migrate local storage atomically
On initialization, read the legacy certificate key once, transform records to document-named fields, persist them under the new document key, then remove the legacy key. The migration must be idempotent and prefer existing document-key data when it is already present.

Clearing existing records was considered, but it would discard issued-document history and invalidate locally stored verification lookups.

### Update the verification API contract
The server verification endpoint will return document-named JSON properties and document-facing errors. The client will consume the renamed response type. Existing verification tokens remain unchanged.

## Risks / Trade-offs

- [Existing local data uses certificate fields] -> Migrate it once during storage initialization and cover legacy records with automated tests.
- [Route and API rename breaks bookmarked integrations] -> Treat removal as an intentional breaking change and document the new document paths in the release notes.
- [Large mechanical rename misses strings or filenames] -> Use repository-wide searches for case variants and validate with type checks, tests, and production build.

## Migration Plan

1. Introduce document-named types, storage APIs, components, routes, and API response fields.
2. Migrate browser data from certificate-named storage and fields during initialization.
3. Remove all certificate-named source files, identifiers, routes, tests, and public text.
4. Validate a legacy stored record, direct document import, and public verification after deployment.
5. Roll back by restoring the previous release; document-key data requires a reverse migration to be readable by the previous release.