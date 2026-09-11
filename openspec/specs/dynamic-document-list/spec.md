# dynamic-document-list Specification

## Purpose

Provide a document list that reflects the fields defined by each selected document template, so administrators can review different document shapes without misleading fixed columns.

## Requirements

### Requirement: Select a template for the document list

The system SHALL provide a template selector on the document list containing active document templates. Selecting a template SHALL limit the table to documents generated from that template.

#### Scenario: Select an active template

- **WHEN** an administrator selects an active document template
- **THEN** the document list SHALL show only documents whose template matches the selection

#### Scenario: No template is selected

- **WHEN** the document list has no selected template
- **THEN** the system SHALL show a clear prompt to select a template and SHALL NOT present a misleading fixed-property table

### Requirement: Render template-defined document columns

The system SHALL create document-list data columns from the selected template's text placeholder keys. Each dynamic column SHALL use a readable label derived from its key and SHALL display the corresponding value from the document's dynamic data.

#### Scenario: Template defines dynamic fields

- **WHEN** a selected template contains text placeholders such as `recipient_name` and `completion_date`
- **THEN** the table SHALL display readable columns for those fields and the matching value for each document

#### Scenario: A document has no value for a template field

- **WHEN** a document does not contain a value for one of the selected template's fields
- **THEN** the corresponding cell SHALL display an empty-value marker without changing the table layout

### Requirement: Keep only relevant fixed columns

The document list SHALL retain status and row actions as fixed columns and SHALL NOT display document IDs or document numbers as table columns.

#### Scenario: Render document rows

- **WHEN** the selected template has documents to display
- **THEN** each row SHALL include status, available template-defined values, and view or revoke actions, with no ID or document-number column

### Requirement: Support list interaction with dynamic fields

The document list SHALL support searching and sorting using the currently displayed template-defined fields, while retaining status filtering and pagination.

#### Scenario: Search dynamic document data

- **WHEN** an administrator enters text matching a value in a visible dynamic field
- **THEN** the list SHALL include the matching document

#### Scenario: Sort a dynamic column

- **WHEN** an administrator sorts by a visible dynamic column
- **THEN** the list SHALL order rows by that column's displayed value and preserve the selected sort direction
