## Context

See proposal.md for the motivation and user-facing scope. `DocumentDetail` currently renders fixed Name, Email, and Course rows. Templates store text placeholder keys in `DocumentTemplate.layout.elements`, while `getTemplateKeys` and `resolveTemplateValue` already normalize keys and resolve case-insensitive dynamic values. `DocumentPreview` also supplies canonical document fields as compatibility data for older documents.

## Goals / Non-Goals

**Goals:**

- Make the detail information card follow the document's associated template.
- Reuse the existing template-key and value-resolution conventions.
- Preserve compatibility with documents whose common values exist only on canonical `Document` fields.
- Keep missing template data and values visibly understandable without breaking the rest of the page.

**Non-Goals:**

- Changing the visual document preview or its template rendering.
- Changing verification, QR generation, printing, revocation, or document storage.
- Adding editable field-label metadata to templates.
- Showing image, signature, QR, or shape elements as information rows.

## Decisions

### Derive rows from the associated template's text keys

The page will load the template matching `documentTemplateId` and derive unique rows from text element keys. This keeps the detail card aligned with the same template schema used by import validation and the document list. An alternative would be to show the union of canonical document fields and dynamic data, but that would reintroduce unrelated or template-inapplicable properties.

### Resolve values through shared normalization with canonical fallbacks

The row value reader will use the existing normalized, case-insensitive template lookup. Its input data will include `dynamicData` plus compatibility aliases for canonical values such as recipient name, email, course, issue date, organization, document title, and document type. This supports older generated documents without making the card hardcoded again.

### Keep unavailable-template behavior local to the information card

If the template cannot be found, the page will render a clear information-card message but continue rendering the existing preview and action controls. A missing template should not make a persisted document unviewable.

### Humanize keys without changing stored identifiers

Labels will convert snake_case, kebab-case, and camelCase keys into readable title-case text. The underlying key remains unchanged for value lookup, so labels are presentation-only and do not affect imports or stored documents.

## Risks / Trade-offs

- [Older documents may not have dynamic data for every template key] -> Render the stable empty marker and use canonical field aliases for common legacy values.
- [A template can be edited after documents are generated] -> Use the currently stored associated template; missing keys or values remain non-fatal and visible.
- [Long or numerous template fields can make the card tall] -> Retain the existing stacked information layout and allow normal page scrolling.