## Purpose

Provide administrators with a deliberate way to permanently remove unwanted documents while keeping workflow records, audit history, and verification results consistent with that removal.

## Requirements

### Requirement: Administrators can permanently delete documents

The system SHALL allow an authenticated administrator to request deletion of a document from the document list or document detail view. The system MUST require an explicit confirmation before deletion, and cancelling the confirmation MUST leave the document unchanged.

#### Scenario: Cancel document deletion

- **WHEN** an administrator opens the delete confirmation and cancels it
- **THEN** the document, its status, and its detail page SHALL remain available

#### Scenario: Confirm document deletion from the list

- **WHEN** an administrator confirms deletion for a listed document
- **THEN** the document SHALL be removed from persisted documents and from the visible list

#### Scenario: Confirm document deletion from the detail page

- **WHEN** an administrator confirms deletion from a document detail page
- **THEN** the document SHALL be removed and the administrator SHALL be returned to the document list

### Requirement: Deletion cleans up document-owned workflow records and preserves an audit record

When a document is deleted, the system SHALL remove approval records belonging to that document and SHALL append an audit entry identifying the deleted document and the acting administrator. Deletion SHALL NOT remove the audit entry created for the deletion.

#### Scenario: Delete a document with approval records

- **WHEN** an administrator confirms deletion of a document with pending, approved, rejected, or revoked workflow records
- **THEN** all approval records for that document SHALL be removed, the document SHALL be absent from storage, and one deletion audit entry SHALL remain

#### Scenario: Delete a document without approval records

- **WHEN** an administrator confirms deletion of a document with no approval records
- **THEN** the document SHALL be removed and a deletion audit entry SHALL still be created

### Requirement: Deleted documents are not locally verifiable

After a document is deleted, the local verification flow SHALL treat its verification token as unknown and SHALL show the existing document-not-found state. The deletion flow SHALL NOT alter unrelated documents or make their verification tokens unavailable.

#### Scenario: Verify a deleted document

- **WHEN** a user opens a deleted document's verification link in the same application persistence context
- **THEN** the verification flow SHALL show "Document Not Found" and SHALL NOT display the deleted document's details

#### Scenario: Verify an unrelated document

- **WHEN** a user opens another document's valid verification link after a different document is deleted
- **THEN** the unrelated document SHALL remain verifiable with its existing status and details