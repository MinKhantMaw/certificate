## Why

Deleting a template that has already generated documents breaks the document-to-template relationship used by previews, dynamic fields, and QR rendering. The template management flow should protect those existing documents while still allowing unused templates to be removed.

## What Changes

- Prevent deletion of a template when any persisted document references its ID.
- Preserve the template and its generated documents when deletion is rejected.
- Allow deletion to continue for templates with no generated documents.
- Show an actionable error in the template management UI when deletion is blocked.
- Add automated coverage for used and unused template deletion.

## Capabilities

### New Capabilities

- `template-lifecycle`: Define safe template deletion rules based on generated document references.

### Modified Capabilities

## Impact

- `src/services/storage.ts`: enforce the reference check in the template deletion operation.
- `src/pages/DocumentTemplates.tsx`: surface deletion failures without removing the template from the displayed list.
- `src/services/storage.test.ts` and related UI tests: cover deletion protection and successful deletion of unused templates.
- Existing document preview, detail, list, and verification behavior remains compatible because referenced templates are retained.