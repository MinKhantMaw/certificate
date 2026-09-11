## Purpose

Provide a focused template detail view where administrators can inspect and manage one document template without crowding the template list.

## ADDED Requirements

### Requirement: Open an individual template detail page
The system SHALL provide an authenticated, addressable detail page for each document template. The Templates list SHALL provide a clear way to open that page for each listed template.

#### Scenario: Open a template from the Templates list
- **WHEN** an administrator selects a template from the Templates list
- **THEN** the system SHALL show the selected template's dedicated detail page

#### Scenario: Open an unavailable template
- **WHEN** an administrator opens a template detail address for a template that is unavailable
- **THEN** the system SHALL show a not-found state with a way to return to the Templates list

### Requirement: Display template details
The template detail page SHALL display the selected template's name, description, status, and visual template preview. It SHALL identify the template's configured dynamic fields when they are present and show a clear empty state when none are configured.

#### Scenario: View a configured template
- **WHEN** an administrator opens a template with configured text fields
- **THEN** the detail page SHALL show its metadata, preview, and the configured dynamic field names

#### Scenario: View a template without text fields
- **WHEN** an administrator opens a template with no configured text fields
- **THEN** the detail page SHALL retain the template metadata and preview and explain that no dynamic fields are configured

### Requirement: Manage a template from its detail page
The template detail page SHALL provide the template-specific sample spreadsheet download, canvas editing, and delete actions. The canvas editor SHALL load the selected template and persist validated changes to that template. Deletion SHALL preserve the existing protection against deleting templates referenced by documents and SHALL surface a failure to the administrator.

#### Scenario: Edit a template from template detail
- **WHEN** an administrator opens a template detail page
- **THEN** the system SHALL show a canvas editor preloaded with the selected template and allow validated changes to be saved

#### Scenario: Download a sample spreadsheet from template detail
- **WHEN** an administrator requests a sample spreadsheet from a template detail page
- **THEN** the system SHALL download the template-specific spreadsheet

#### Scenario: Delete an unreferenced template from template detail
- **WHEN** an administrator confirms deletion of a template not referenced by any document
- **THEN** the system SHALL delete the template and return to the Templates list

#### Scenario: Attempt to delete a referenced template from template detail
- **WHEN** an administrator confirms deletion of a template referenced by a document
- **THEN** the system SHALL keep the template and display the deletion failure

### Requirement: Keep the Templates list focused on navigation
The Templates list SHALL not expose template-specific sample spreadsheet download, edit, or delete controls on each list item. It SHALL retain template summary information and access to each template's detail page.

#### Scenario: Review the Templates list
- **WHEN** an administrator views the Templates list
- **THEN** each template item SHALL show its summary and a way to open details without inline sample-download, edit, or delete controls