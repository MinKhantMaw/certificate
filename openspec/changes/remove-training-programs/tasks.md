## 1. Retire the training-program model

- [x] 1.1 Remove training-program, trainee, training-code, and program-approval fields and types from the client data model; verify `npm run lint` passes.
- [x] 1.2 Replace program-coupled storage APIs with direct-import generation and migrate browser storage to remove retired records and relationships; verify a pre-existing certificate remains readable after initialization.
- [x] 1.3 Update demo data to seed certificates, templates, and direct-import records without a training program; verify a fresh local-storage session loads usable demo data.

## 2. Build the direct certificate upload workflow

- [x] 2.1 Replace the program-scoped Excel import page with a template-scoped direct import page and route; verify the page requires an active template before it processes a file.
- [x] 2.2 Parse and validate supported Excel files for recipient, email, duplicate, file-size, row-limit, and selected-template-field errors; verify valid and invalid rows are shown in the paginated preview.
- [x] 2.3 Generate valid certificates and a completed import batch from an all-valid preview using existing certificate-number and verification helpers; verify every generated certificate is valid and has a unique short ID and verification URL.
- [x] 2.4 Add a certificate-list upload action that opens the direct import page; verify an administrator can reach the full upload workflow from `/certificates`.

## 3. Remove retired application surfaces

- [x] 3.1 Remove training-program pages, import-program selection, import approval pages, related route registrations, and navigation links; verify retired URLs resolve to the application fallback and no navigation item exposes the feature.
- [x] 3.2 Update import history to display file, template, row counts, status, and submission time without training-program data; verify completed direct imports render without missing-data labels.
- [x] 3.3 Update certificate consumers to stop reading training-program associations while preserving list, detail, verification, and revocation behavior; verify `npm run lint` passes.

## 4. Validate the end-to-end flow

- [x] 4.1 Configure the project's automated test runner and browser-storage test environment; verify the test command runs in a clean checkout.
- [x] 4.2 Add template CRUD tests covering creation, update, deletion, persisted template state, and rejection of invalid template input; verify the focused template test suite passes.
- [x] 4.3 Add direct certificate upload tests covering template selection, valid spreadsheet parsing, required-template-field validation, invalid email, duplicate rows, size and row limits, and blocked generation with invalid rows; verify the focused upload test suite passes.
- [x] 4.4 Add direct-generation tests confirming certificates receive unique identifiers and verification URLs without training-program data; verify generated certificate and import-batch assertions pass.
- [x] 4.5 Add regression coverage that retired training-program routes and storage dependencies are absent; verify direct imports succeed independently of retired records.
- [x] 4.6 Run `npm run lint`, the automated test command, and `npm run build`; verify all commands succeed.
- [x] 4.7 Manually upload a valid Excel file through the certificate list and verify generated certificates appear in the list, render with the selected template, and open through their verification URLs.
- [x] 4.8 Manually upload an Excel file with invalid data and verify generation stays unavailable while row-level errors remain visible.