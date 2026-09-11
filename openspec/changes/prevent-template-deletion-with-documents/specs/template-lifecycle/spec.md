## Purpose

Protect document history by keeping templates that are referenced by generated documents, while allowing administrators to remove templates that have never been used.

## ADDED Requirements

### Requirement: Protect templates referenced by documents

The system SHALL refuse to delete a document template when any persisted document references that template's ID. The operation SHALL leave both the template and all referencing documents unchanged.

#### Scenario: Delete a template used by a document

- **WHEN** an administrator attempts to delete a template referenced by one or more generated documents
- **THEN** the system SHALL reject the deletion, retain the template and documents, and return an actionable error explaining that the template is in use

#### Scenario: Delete a template referenced by a revoked document

- **WHEN** an administrator attempts to delete a template referenced by a revoked document
- **THEN** the system SHALL reject the deletion because revoked documents remain part of document history

### Requirement: Allow deletion of unused templates

The system SHALL delete a template when no persisted document references its ID.

#### Scenario: Delete a template with no generated documents

- **WHEN** an administrator confirms deletion of a template that has no referencing documents
- **THEN** the system SHALL remove the template from template storage and the template management view

### Requirement: Surface protected deletion failures

The template management interface SHALL show the deletion error when a deletion is rejected and SHALL keep the protected template available for editing and future use.

#### Scenario: Deletion is rejected in template management

- **WHEN** template deletion fails because generated documents reference the template
- **THEN** the interface SHALL display the failure reason and SHALL continue to show the template in the template list

#### Scenario: Existing documents remain usable after rejection

- **WHEN** deletion of a referenced template is rejected
- **THEN** documents using that template SHALL remain available for their existing preview, detail, verification, and template-driven rendering behavior