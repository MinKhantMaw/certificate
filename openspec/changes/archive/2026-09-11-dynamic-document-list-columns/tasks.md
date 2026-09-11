## 1. Template-driven list state

- [x] 1.1 Load active document templates in the document list and add a template selector whose selection resets pagination, search, and sort state; verify with a focused render test that selecting a template filters rows by `documentTemplateId`.
- [x] 1.2 Derive normalized dynamic column descriptors from the selected template's text placeholder keys and create readable headers; verify duplicate keys and non-text template elements do not create duplicate columns.
- [x] 1.3 Add dynamic value resolution with case-insensitive key matching and an empty-value marker; verify documents with missing or differently cased `dynamicData` keys render stable cells.

## 2. Table interactions and presentation

- [x] 2.1 Replace hardcoded document-property headers and cells with the selected template's dynamic columns while retaining status and actions; verify rendered table text contains no ID or document-number header or cell.
- [x] 2.2 Update search and sorting to operate on visible dynamic fields while preserving status filtering, pagination, view links, and revoke behavior; verify a dynamic value can be found and sorted in both directions.
- [x] 2.3 Add clear empty states for no selected template, templates without text fields, and templates with no matching documents; verify each state keeps the table layout usable.

## 3. Regression coverage

- [x] 3.1 Add or extend document-list UI tests with multiple templates and documents to cover template selection, row filtering, dynamic headers, hidden IDs, dynamic search, and dynamic sorting; verify with the focused Vitest test command.
- [x] 3.2 Run the relevant existing test suite and TypeScript/build validation; verify document generation, document detail, and verification tests remain passing.