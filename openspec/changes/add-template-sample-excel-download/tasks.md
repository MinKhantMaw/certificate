## 1. Sample Workbook Utility

- [x] 1.1 Add a client-side import utility that derives ordered, unique sample headers only from normalized template text keys; verify focused unit tests cover empty, duplicate, and import-required template keys.
- [x] 1.2 Create a single-sheet, header-only `.xlsx` workbook and a sanitized template-derived download filename using the existing spreadsheet dependency; verify the generated workbook can be read back with the expected headers and no data rows.

## 2. Template Download Action

- [x] 2.1 Add an accessible sample Excel download control to each document template card and connect it to the workbook utility; verify invoking the control produces the expected `.xlsx` download for that template.
- [x] 2.2 Preserve template edit and deletion behavior while adding the new action; verify the existing `DocumentTemplates` tests remain green.

## 3. Validation

- [x] 3.1 Add or update tests proving that a row completed from a template sample meets existing direct-import validation when its template includes required fields; verify the repository's supported focused Vitest command passes.
- [x] 3.2 Run `npm run lint` and `npm test` to verify type safety and the complete test suite.

## 4. Template-Driven Upload Validation

- [x] 4.1 Remove hardcoded recipient, email, format, and duplicate checks from imported spreadsheet validation; verify a row containing only selected-template fields is valid.