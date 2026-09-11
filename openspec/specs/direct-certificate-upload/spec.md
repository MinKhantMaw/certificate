# direct-certificate-upload Specification

## Purpose

Enable administrators to issue certificates from a validated Excel file without first creating a training program.

## Requirements

### Requirement: Upload certificates from the certificate list
The system SHALL provide an upload action on the certificate list that opens a direct certificate-import workflow. The workflow SHALL require the user to select an active certificate template before accepting an Excel file.

#### Scenario: Select a template before upload
- **WHEN** an administrator opens direct certificate import
- **THEN** the system SHALL require an active template selection before the Excel file is processed

#### Scenario: No active templates exist
- **WHEN** an administrator opens direct certificate import with no active templates available
- **THEN** the system SHALL prevent file upload and identify that an active template is required

### Requirement: Validate uploaded certificate data
The system SHALL parse `.xlsx` and `.xls` files up to 10 MB and 5,000 rows, then show a paginated preview of every parsed row. Each row SHALL include a recipient name and valid email address, and SHALL supply each field required by the selected template. The system SHALL report empty files, oversized files, excessive row counts, duplicate recipient-email rows, and missing or invalid values.

#### Scenario: Preview valid rows
- **WHEN** an administrator uploads a supported file whose rows meet the selected template's requirements
- **THEN** the system SHALL display the parsed rows as valid and show a certificate preview using the first row

#### Scenario: Show validation errors
- **WHEN** an uploaded file contains a row with missing, invalid, or duplicate data
- **THEN** the system SHALL mark that row invalid and display its validation errors in the preview

### Requirement: Generate direct-import certificates
The system SHALL enable certificate generation only when every imported row is valid. On generation, the system SHALL create one valid certificate for each imported row using the selected template, with a unique certificate number, short ID, and verification URL. The generated certificate SHALL derive its display fields from the row data, using defined defaults where optional certificate metadata is absent.

#### Scenario: Generate certificates after validation
- **WHEN** all rows in a validated import are valid and the administrator generates certificates
- **THEN** the system SHALL create and persist one valid certificate per row and report the generated count

#### Scenario: Prevent generation with invalid rows
- **WHEN** one or more rows in an uploaded file are invalid
- **THEN** the system SHALL prevent certificate generation until the import is replaced or corrected

### Requirement: Verify direct upload behavior
The direct certificate upload workflow SHALL have automated test coverage for template selection, accepted and rejected spreadsheet rows, and certificate generation.

#### Scenario: Test an upload with a selected template
- **WHEN** the automated test suite runs a valid direct import
- **THEN** it SHALL verify that the selected template is required, the import passes validation, and one certificate is generated for each row

#### Scenario: Test an upload with invalid data
- **WHEN** the automated test suite runs an import with a missing required field, invalid email address, or duplicate recipient-email row
- **THEN** it SHALL verify that the affected row reports an error and certificate generation remains unavailable