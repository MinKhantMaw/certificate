## Why

The document detail page currently lets an administrator switch QR rendering on or off independently of the selected template. This makes the final document differ from the template design and adds a stateful control to a workflow where QR placement should be intentional and consistent.

## What Changes

- Remove the document detail page's QR On/QR Off control and its local visibility state.
- Render QR codes when, and only when, the selected template layout contains a QR element.
- Apply the same template-driven rule to legacy and dynamic document previews, including printed output.
- Keep QR generation, verification links, and print readiness intact; documents with a QR element must still wait for QR generation before printing.
- Add tests covering templates with a QR element, templates without one, and the removed toggle behavior.

## Capabilities

### New Capabilities

- `template-driven-qr-display`: Define QR visibility from the selected document template's QR element.

### Modified Capabilities

- `dynamic-document-detail`: Replace the QR visibility control requirement with template-driven QR rendering while preserving verification, preview, printing, and revocation actions.

## Impact

- Affects `DocumentDetail`, `DocumentPreview`, and their QR/print readiness integration.
- Updates document detail and preview tests; no API or persisted document schema changes are expected.
- Existing templates without a QR element will no longer display a QR code by default, while templates containing one will render it at the configured element position.