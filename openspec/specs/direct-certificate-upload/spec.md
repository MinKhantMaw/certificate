# direct-certificate-upload Specification

## Purpose

Enable administrators to issue documents from a validated Excel file without first creating a training program.

## Requirements

### Requirement: Upload certificates from the certificate list
The system SHALL provide an upload action on the document list that opens a direct document-import workflow. The workflow SHALL require the user to select an active document template before accepting an Excel file.

#### Scenario: Select a template before upload
- **WHEN** an administrator opens direct document import
- **THEN** the system SHALL require an active template selection before the Excel file is processed

#### Scenario: No active templates exist
- **WHEN** an administrator opens direct document import with no active templates available
- **THEN** the system SHALL prevent file upload and identify that an active template is required

### Requirement: Download a template-specific sample spreadsheet
The system SHALL provide a sample Excel download action for each document template. The downloaded `.xlsx` workbook SHALL contain one worksheet with a header row containing each distinct configured text-field key from that template, in layout order. The workbook SHALL contain no recipient data rows and SHALL not add fields that are absent from the template.

#### Scenario: Download a sample for a configured template
- **WHEN** an administrator requests a sample spreadsheet from a template with configured text fields
- **THEN** the system SHALL download an `.xlsx` workbook whose headers are that template's distinct text-field keys

#### Scenario: Download a sample for a template without configured text fields
- **WHEN** an administrator requests a sample spreadsheet from a template without configured text fields
- **THEN** the system SHALL download an `.xlsx` workbook without headers or recipient data rows

#### Scenario: Use a completed sample spreadsheet for import
- **WHEN** an administrator supplies valid values in all required columns of a downloaded sample spreadsheet whose template defines the import-required fields
- **THEN** the system SHALL validate the row as eligible for document generation

### Requirement: Validate uploaded certificate data
The system SHALL parse `.xlsx` and `.xls` files up to 10 MB and 5,000 rows, then show a paginated preview of every parsed row. Each row SHALL supply each field configured by the selected template. The system SHALL report empty files, oversized files, excessive row counts, and missing template-field values. The system SHALL NOT require, format-check, or deduplicate fields that are not configured by the selected template.

#### Scenario: Preview valid rows
- **WHEN** an administrator uploads a supported file whose rows meet the selected template's requirements
- **THEN** the system SHALL display the parsed rows as valid and show a document preview using the first row

#### Scenario: Show validation errors
- **WHEN** an uploaded file contains a row with a missing configured template field
- **THEN** the system SHALL mark that row invalid and display its validation error in the preview

#### Scenario: Accept rows without unconfigured canonical fields
- **WHEN** an uploaded row supplies all fields configured by the selected template but omits `recipient_name` or `email` because the template does not define them
- **THEN** the system SHALL validate the row without reporting those omitted fields as errors

### Requirement: Generate direct-import certificates
The system SHALL enable document generation only when every imported row is valid. On generation, the system SHALL create one valid document for each imported row using the selected template, with a unique document number, short ID, and verification URL. The generated document SHALL derive its display fields from the row data, using defined defaults where optional document metadata is absent.

#### Scenario: Generate certificates after validation
- **WHEN** all rows in a validated import are valid and the administrator generates documents
- **THEN** the system SHALL create and persist one valid document per row and report the generated count

#### Scenario: Prevent generation with invalid rows
- **WHEN** one or more rows in an uploaded file are invalid
- **THEN** the system SHALL prevent document generation until the import is replaced or corrected

### Requirement: Verify direct upload behavior
The direct document upload workflow SHALL have automated test coverage for template selection, accepted and rejected spreadsheet rows, and document generation.

#### Scenario: Test an upload with a selected template
- **WHEN** the automated test suite runs a valid direct import
- **THEN** it SHALL verify that the selected template is required, the import passes validation, and one document is generated for each row

#### Scenario: Test an upload with invalid data
- **WHEN** the automated test suite runs an import with a missing required field, invalid email address, or duplicate recipient-email row
- **THEN** it SHALL verify that the affected row reports an error and document generation remains unavailable

### Requirement: Verify sample spreadsheet download behavior
The direct document upload workflow SHALL have automated test coverage for generation of sample spreadsheet headers from the selected template and for the template download action.

#### Scenario: Test template-derived sample headers
- **WHEN** the automated test suite generates a sample spreadsheet for a template with duplicate or import-required field keys
- **THEN** it SHALL verify that the output contains each configured header once in layout order and no unconfigured fields

#### Scenario: Test the template download action
- **WHEN** the automated test suite invokes the sample download action for a template
- **THEN** it SHALL verify that an `.xlsx` download is produced for that template