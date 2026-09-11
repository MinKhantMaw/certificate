## MODIFIED Requirements

### Requirement: Preserve detail actions and preview behavior

The dynamic document detail page SHALL preserve its verification link, template-driven QR rendering, print readiness, revoke action, and rendered document preview. It SHALL NOT provide a separate QR visibility control.

#### Scenario: Open a dynamic document detail page

- **WHEN** an administrator views a valid document with template-defined fields
- **THEN** the page SHALL show dynamic information rows, render QR content according to the selected template, and retain the existing preview and detail actions

#### Scenario: View a document whose template has no QR element

- **WHEN** an administrator views a valid document whose selected template contains no QR element
- **THEN** the preview SHALL omit the verification QR code and the detail page SHALL still provide verification, printing, and revocation actions