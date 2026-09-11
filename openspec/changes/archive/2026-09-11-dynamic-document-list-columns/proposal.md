## Why

The document list currently presents a fixed set of certificate-era fields even though document properties are defined by the selected document template. This makes documents created from different templates difficult to scan and exposes an ID column that is not useful to the list workflow.

## What Changes

- Add a document-template selector to the document list.
- Filter listed documents by the selected template.
- Build table columns from the selected template's text placeholder keys.
- Render dynamic document values from `dynamicData`.
- Keep status and row actions as fixed columns.
- Remove the ID and document-number columns from the table.
- Use readable labels for dynamic placeholder keys.
- Add focused coverage for template selection, filtering, dynamic columns, and empty states.

## Capabilities

### New Capabilities

- `dynamic-document-list`: Display documents with columns and rows derived from the selected document template.

### Modified Capabilities

<!-- No existing capability currently specifies document-list presentation behavior. -->

## Impact

- The React document list page and its local state for templates, filtering, searching, and sorting.
- Existing document and template types and storage access remain the source of persisted data.
- New UI tests will cover the selected-template behavior without changing document-generation or verification APIs.