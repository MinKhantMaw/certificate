## 1. Template-driven detail data

- [x] 1.1 Load the document's associated template in the detail page and represent loading, unavailable-template, and loaded states without blocking existing document actions; verify the page remains usable when a template is missing.
- [x] 1.2 Derive unique detail-field descriptors from the template's text placeholder keys and humanize their labels; verify duplicate keys and image, signature, QR, and shape elements do not create information rows.
- [x] 1.3 Build the detail value data from `dynamicData` with canonical document-field fallbacks and case-insensitive lookup; verify dynamic values, legacy canonical values, and missing values resolve correctly.

## 2. Detail presentation

- [x] 2.1 Replace the hardcoded Name, Email, and Course rows with template-defined information rows and a stable empty-value marker; verify template-specific labels and values appear in the information card.
- [x] 2.2 Add the unavailable-template and no-template-fields empty states while preserving the document preview and action controls; verify verification, QR, print, and revoke controls remain rendered.

## 3. Regression coverage

- [x] 3.1 Add focused document-detail tests covering template-defined fields, duplicate/non-text elements, canonical fallbacks, missing values, and unavailable templates; verify with the focused Vitest command.
- [x] 3.2 Run the full test suite, TypeScript validation, and production build; verify existing preview, verification, and document route tests remain passing.