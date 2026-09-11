## Purpose

Define predictable QR-code rendering so a document's verification QR code is controlled by the selected template layout rather than by a separate per-document switch.

## Requirements

### Requirement: Render QR codes from template elements

The system SHALL render a document verification QR code at each QR element defined by the selected template layout. The system SHALL NOT render a QR code when the selected template contains no QR element.

#### Scenario: Template contains a QR element

- **WHEN** a document is previewed or printed with a valid template containing a QR element
- **THEN** the verification QR code SHALL appear at that element's configured position and size

#### Scenario: Template does not contain a QR element

- **WHEN** a document is previewed or printed with a valid template containing no QR element
- **THEN** the document SHALL contain no verification QR code

#### Scenario: Template cannot be loaded

- **WHEN** a document's associated template cannot be loaded
- **THEN** the system SHALL preserve the existing template-unavailable preview state and SHALL NOT expose an independent QR visibility switch

### Requirement: Keep QR generation and printing consistent with layout

The system SHALL generate and display a verification QR code for a configured QR element using the document's existing verification data. Printing SHALL wait for QR generation only when the selected template contains a QR element.

#### Scenario: QR generation is pending

- **WHEN** a document with a QR element is preparing its verification QR code
- **THEN** the print action SHALL remain unavailable until the QR is ready or an actionable generation error is shown

#### Scenario: QR generation is not needed

- **WHEN** a document's template has no QR element
- **THEN** the print action SHALL be available without waiting for QR generation