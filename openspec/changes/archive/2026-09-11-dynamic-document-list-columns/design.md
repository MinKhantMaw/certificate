## Context

See proposal.md for the motivation and user-facing scope. The current document list stores documents in local storage and renders fixed fields from `Document`. Templates already store text placeholder keys in `DocumentTemplate.layout.elements`, `getTemplateKeys` normalizes those keys, and generated documents retain imported values in `dynamicData`.

## Goals / Non-Goals

**Goals:**

- Make the selected active template the source of truth for visible document properties.
- Keep documents from different templates separated in the list view.
- Reuse existing storage and template-key behavior rather than changing persisted data.
- Make dynamic fields searchable and sortable with stable table geometry.

**Non-Goals:**

- Changing document generation, Excel validation, document detail, or verification behavior.
- Adding field-label metadata to the template model.
- Removing document IDs from document detail pages or search internals; they are only removed from table presentation.

## Decisions

### Use template selection as both schema selection and row filtering

The list will load active templates, require a selected template before showing dynamic columns, and filter documents by `documentTemplateId`. This avoids mixing incompatible field sets from multiple templates. An alternative would be an all-templates view with the union of every field, but that produces sparse, ambiguous tables and does not match the requested template-dependent columns.

### Derive columns from text placeholder keys

The list will call the existing `getTemplateKeys` behavior against the selected template layout. Keys will be humanized for headers, while lookup will use the normalized key against `dynamicData` with the same case-insensitive fallback behavior used by template rendering. Non-text layout elements will not create columns.

### Keep status and actions fixed, remove ID presentation

Status and actions remain outside the dynamic column model because they are list operations, not template properties. Document ID and document number will not be rendered as table headers or cells, though existing internal identifiers remain available for links, mutations, and search compatibility where needed.

### Replace hardcoded sort keys with a column descriptor

The page will derive a descriptor for each visible dynamic field containing its key, label, and value reader. Sorting and searching will operate over these descriptors; status filtering, pagination, view links, and revoke behavior will remain in the page. This keeps the table behavior aligned with the columns the user can see.

## Risks / Trade-offs

- [Legacy documents may have missing or differently cased dynamic keys] -> Normalize template keys and use an empty-value marker when no value is available.
- [Templates with many text elements can make the table wide] -> Keep the existing horizontal scroll container and stable cell styling.
- [Removing the ID column may reduce direct identification in the list] -> Preserve the view action and existing internal IDs; the requested table no longer exposes IDs as columns.
- [A template may have no text placeholders] -> Show the fixed status/actions structure with an explicit empty-state message rather than inventing columns.