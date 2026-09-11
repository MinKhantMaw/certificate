## 1. Storage and Verification Behavior

- [x] 1.1 Add a storage delete operation that validates the document ID, removes the document from `cms_documents`, removes matching approval records, and appends one deletion audit entry; verify with storage tests for valid, missing, and unknown IDs.
- [x] 1.2 Persist and consult local deletion markers by verification token so a deleted document cannot be recovered by the local verification fallback; verify deleted and unrelated tokens with verification tests.

## 2. Document List Experience

- [x] 2.1 Add a delete row action and confirmation modal to the document list using the existing confirmation component; verify cancelling leaves the row and confirming removes it.
- [x] 2.2 Refresh list state and pagination after a successful list deletion, and surface storage errors without hiding the document; verify the list UI tests cover success, cancel, and failure paths.

## 3. Document Detail Experience

- [x] 3.1 Add a delete action and confirmation modal to the document detail page alongside revoke; verify cancelling preserves the detail view and confirming removes the document.
- [x] 3.2 Navigate to the document list only after successful detail deletion and display an actionable error when deletion fails; verify with document detail tests.

## 4. Regression Verification

- [x] 4.1 Run the focused storage, document list, document detail, and verification test suites and confirm existing revoke, preview, dynamic-field, and unrelated verification behavior remains passing.
- [x] 4.2 Run `npm run lint` and `npm run build` to verify the completed deletion flow introduces no TypeScript or production-build errors.