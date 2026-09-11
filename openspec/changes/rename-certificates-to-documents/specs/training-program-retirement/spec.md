## MODIFIED Requirements

### Requirement: Remove training-program user interfaces
The system SHALL not expose training-program pages, training-program routes, or training-program navigation. It SHALL not present training-program selection or training-code validation in the document import workflow.

#### Scenario: Navigate the administrative application
- **WHEN** an administrator views navigation and application routes
- **THEN** no training-program management or program-scoped document-import destination SHALL be available

### Requirement: Retire training-program data dependencies
The system SHALL not create or require training-program records, training-program identifiers, training codes, trainees, or program approval assignments to import or generate documents. Import batches and pending import rows SHALL retain the file, template, validation, and audit information needed for direct document generation without these fields.

#### Scenario: Generate an uploaded certificate
- **WHEN** an administrator generates documents from a valid direct import
- **THEN** each generated document SHALL be independent of a training-program record

#### Scenario: Load existing client data
- **WHEN** the application loads client data created before training-program retirement
- **THEN** it SHALL remove obsolete training-program records and prevent retired relationships from being used by active workflows

### Requirement: Present imports without training programs
The system SHALL present import history and any import-review surface using direct-import metadata rather than a training-program name or code.

#### Scenario: View import history
- **WHEN** an administrator views a completed direct import
- **THEN** the history SHALL identify the import file, template, row counts, status, and submission time without a training-program column

### Requirement: Verify retired behavior
The system SHALL have automated regression coverage confirming that active document flows do not depend on training-program records or routes.

#### Scenario: Test retired program surfaces
- **WHEN** the automated test suite checks application routes and storage behavior
- **THEN** it SHALL verify that a direct document import succeeds without training-program data and that retired training-program destinations are unavailable