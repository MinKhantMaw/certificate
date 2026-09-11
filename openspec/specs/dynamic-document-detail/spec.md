# dynamic-document-detail Specification

## Purpose

Provide document detail information that reflects the selected template's fields, so administrators can inspect all relevant properties without relying on certificate-specific hardcoded labels.

## Requirements

### Requirement: Display template-defined document information

The document detail page SHALL load the document's associated template and display one information row for each text placeholder key defined by that template. Each row SHALL use a readable label and the document's corresponding dynamic value.

#### Scenario: Template defines document fields

- **WHEN** an administrator opens a document whose template defines text fields such as `recipient_name` and `completion_date`
- **THEN** the information section SHALL display readable rows for those fields using the document's values

#### Scenario: Template includes duplicate or non-text elements

- **WHEN** the selected template contains duplicate text keys or non-text elements
- **THEN** the information section SHALL display each text key once and SHALL NOT create rows for non-text elements

### Requirement: Handle missing detail templates and values

The document detail page SHALL keep its information section usable when the associated template or a field value is unavailable. Missing values SHALL use a stable empty-value marker, and an unavailable template SHALL show an explanatory empty state without preventing document preview or actions.

#### Scenario: Dynamic value is missing

- **WHEN** a template field has no corresponding value in the document data
- **THEN** its information row SHALL display an empty-value marker without shifting or removing other rows

#### Scenario: Associated template is unavailable

- **WHEN** the document references a template that cannot be loaded
- **THEN** the information section SHALL explain that template fields are unavailable while verification, QR, printing, preview, and revocation actions remain usable

### Requirement: Preserve detail actions and preview behavior

The dynamic information behavior SHALL NOT change the document detail page's verification link, QR visibility control, print readiness, revoke action, or rendered document preview.

#### Scenario: Open a dynamic document detail page

- **WHEN** an administrator views a valid document with template-defined fields
- **THEN** the page SHALL show dynamic information rows and retain the existing preview and detail actions
