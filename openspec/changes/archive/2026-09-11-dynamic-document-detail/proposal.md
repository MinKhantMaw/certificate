## Why

The document detail page still presents hardcoded Name, Email, and Course fields even though each document's properties are defined by its selected template. This causes detail views to omit template-specific properties and can show labels that do not apply to the document.

## What Changes

- Load the document's selected template when opening the detail page.
- Replace hardcoded information rows with rows derived from the template's text placeholder keys.
- Display readable labels and values from the document's dynamic data.
- Handle missing template fields or values with stable empty states.
- Keep verification, QR, printing, revocation, and the visual document preview unchanged.
- Add focused tests for template-defined detail fields and missing data.

## Capabilities

### New Capabilities

- `dynamic-document-detail`: Display document information using the selected document template's dynamic fields.

### Modified Capabilities

<!-- No existing capability specifies document-detail information presentation. -->

## Impact

- The React document detail page and its template-loading state.
- Existing `DocumentTemplate.layout` and `Document.dynamicData` data; no persistence or API changes.
- New focused UI tests for template-specific detail fields, labels, values, and empty states.