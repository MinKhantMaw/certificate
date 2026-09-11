## 1. Derive QR requirement from templates

- [x] 1.1 Remove the document-detail QR On/QR Off state and control, and pass template-derived QR readiness to printing; verify the detail page no longer exposes either toggle label.
- [x] 1.2 Update the shared document preview so dynamic layouts render QR content only for `qr` elements and legacy fallback output does not invent a QR; verify templates without QR elements produce no QR markup.
- [x] 1.3 Preserve QR loading, retry, verification-link, template-error, and revoke behavior while aligning print readiness with the presence of a QR element; verify documents without QR elements can print without QR loading.

## 2. Regression coverage

- [x] 2.1 Update document-detail fixtures and assertions for templates with and without QR elements, including removal of the QR toggle assertion; verify the focused detail test suite passes.
- [x] 2.2 Add shared-preview coverage for QR-present and QR-absent layouts and configured element rendering; verify the focused preview tests pass.

## 3. Validation

- [x] 3.1 Run the complete automated test suite and TypeScript/build checks; verify existing document import, verification, and template-builder behavior remains passing.
- [x] 3.2 Review active templates for required QR elements after deployment and document any template updates needed for administrators; verify QR-required templates contain a `qr` layout element.