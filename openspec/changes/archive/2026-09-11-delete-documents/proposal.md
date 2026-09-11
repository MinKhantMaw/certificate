## Why

Administrators can currently revoke documents, but cannot remove an incorrectly generated or test document from the persisted document collection. A deliberate hard-delete flow is needed to keep the document list accurate and ensure deleted verification links no longer resolve.

This proposal assumes deletion is an administrator-only, irreversible removal from the app's current local persistence model. Revocation remains the choice when a historical record must be retained.

## What Changes

- Add a document deletion operation to storage that removes one document by its stable ID.
- Remove related approval records when a document is deleted so orphaned workflow data is not retained.
- Add delete actions to the document list and document detail views behind an explicit confirmation modal.
- Return the administrator to the document list after deleting from the detail view and refresh list state after deleting from the list view.
- Make deleted documents unavailable through local verification lookup; preserve the existing not-found experience.
- Record document deletion in the existing audit log with the deleting user and document ID.
- Add storage and UI coverage for confirmation, successful deletion, related-record cleanup, audit logging, and deleted-document lookup behavior.

## Capabilities

### New Capabilities

- `document-lifecycle`: Define administrator document deletion, cleanup, audit, and verification behavior.

### Modified Capabilities

<!-- No existing requirement set changes; dynamic document list/detail behavior remains compatible. -->

## Impact

- `src/services/storage.ts`: document deletion, approval cleanup, audit logging, and lookup behavior.
- `src/pages/DocumentList.tsx` and `src/pages/DocumentDetail.tsx`: confirmation and delete actions.
- `src/services/storage.test.ts`, `src/pages/DocumentList.test.tsx`, and detail-related tests: automated coverage.
- `src/pages/VerifyDocument.tsx`: preserve the not-found result after local deletion and prevent fallback data from masking a deleted local document if needed by the implementation.
- No new dependency is required. The current Vercel verification endpoint is backed by a separate static dataset; synchronizing server-side records is outside this change unless implementation constraints require an explicit boundary.