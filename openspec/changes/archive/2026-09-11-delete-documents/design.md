## Context

The application currently persists documents, approvals, and audit logs in separate localStorage collections exposed through `src/services/storage.ts`. Documents can be revoked, but there is no document delete operation. `DocumentList` already owns row actions and refreshes its local document state, while `DocumentDetail` owns the detail-page revoke confirmation and navigation. Public verification first checks local storage and then falls back to the static Vercel endpoint.

## Goals / Non-Goals

**Goals:**

- Add one storage-level delete operation that updates all local collections consistently.
- Reuse the existing `ConfirmModal` pattern for both list and detail actions.
- Keep deletion behavior testable without introducing a new persistence dependency.
- Ensure local verification cannot resurrect a deleted locally persisted document through the fallback path.

**Non-Goals:**

- Do not replace deletion with revocation; both actions remain distinct.
- Do not add a server-backed document database or change the static `/api/verify` fixture in this change.
- Do not remove audit history for the deleted document.
- Do not add bulk deletion, undo, or recovery.

## Decisions

### Use a storage-level hard delete

Add a single operation that removes the matching document from `cms_documents`, filters its matching entries from `cms_approvals`, and writes a deletion audit record using the current user. The operation should identify documents by the same stable ID accepted by existing document lookup methods and should fail clearly when no document matches.

This keeps cleanup atomic at the application boundary and avoids duplicating persistence rules in two pages. A UI-only filter was rejected because it would leave deleted documents retrievable by detail links and verification tokens.

### Track locally deleted verification tokens

Persist a small set of locally deleted verification tokens (or an equivalent tombstone marker) so `VerifyDocument` can distinguish a deliberately deleted local document from a missing local cache entry before calling the static API fallback. This is needed because the fallback fixture is independent of localStorage and could otherwise return demo data for a token that an administrator just deleted.

The marker is local-only and must be checked only for the matching token, so deleting one document cannot affect other verification links. A server-side deletion record is rejected as out of scope because the current API does not persist documents created by the app.

### Keep confirmation and navigation at the page level

`DocumentList` will own list delete state, refresh the list after confirmation, and reset the selected page if the deletion empties the current page. `DocumentDetail` will own detail delete state and navigate to `/documents` only after storage deletion succeeds. Both pages will show an actionable error if deletion fails rather than hiding the record.

The existing confirmation component is preferred over browser confirmation because it is already used for revoke and is covered by the page test patterns.

### Preserve audit history as the deletion record

Use the existing audit log shape with a document entity type and a deletion action. No separate deletion-history model is needed; retaining the audit entry provides traceability without making deleted document content retrievable.

## Risks / Trade-offs

- [Risk] A browser-local tombstone does not synchronize deletion to other browsers or the static API. -> Mitigation: document the local persistence boundary and keep server-backed deletion explicitly out of scope; future server persistence must enforce deletion at the API layer.
- [Risk] Existing callers may pass an unknown document ID. -> Mitigation: return a clear error and leave all collections unchanged; cover this behavior in storage tests.
- [Risk] Removing approval records can discard unfinished workflow state. -> Mitigation: require explicit confirmation and retain the deletion audit entry; revocation remains available for records that must be retained.

## Migration Plan

No data migration is required. Existing documents remain unchanged until an administrator explicitly deletes one. The new tombstone collection starts empty and can be removed during rollback along with the new delete UI and storage operation.