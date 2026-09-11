## Why

Certificate issuance currently depends on creating and completing a training program before an Excel roster can be uploaded. This adds an unnecessary workflow for users who already have certificate data and only need to select a template, validate the file, and generate certificates.

## What Changes

- Add direct certificate upload from the certificate list: select an active template, upload an Excel file, validate its rows, and generate valid certificates.
- Define the spreadsheet fields required to generate a certificate without a training-program record, including recipient and certificate metadata.
- **BREAKING** Remove training-program management screens, routes, navigation, storage APIs, types, and demo data.
- **BREAKING** Remove training-program and training-code requirements from certificate imports, import batches, pending rows, trainees, and newly generated certificates.
- Update import history and approval views to present direct-import information without resolving a training program.
- Preserve template selection, certificate identifiers, verification links, certificate status, audit logging, and existing certificate list behavior.

## Capabilities

### New Capabilities
- `direct-certificate-upload`: Upload, validate, and generate certificates from an Excel file after selecting an active certificate template.
- `training-program-retirement`: Remove training-program dependencies and management surfaces from certificate operations.

### Modified Capabilities

- None.

## Impact

- Affected UI: certificate list, import upload and preview, import history, import approvals, sidebar navigation, and application routing.
- Affected client storage and types: training programs, trainees, import batches, pending import rows, certificates, and demo data.
- The existing `xlsx` dependency remains the Excel parser; no new external dependency is expected.