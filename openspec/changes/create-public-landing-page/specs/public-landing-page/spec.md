## Purpose

Provide a clear public introduction to the certificate management product at the root URL, helping visitors understand its reusable workflows and reach the appropriate authenticated or verification experience.

## ADDED Requirements

### Requirement: Public visitors can access the landing page
The system SHALL render the landing page at `/` without requiring authentication or redirecting the visitor to login.

#### Scenario: Unauthenticated visitor opens the root URL
- **WHEN** an unauthenticated visitor navigates to `/`
- **THEN** the visitor sees the landing page successfully

#### Scenario: Authenticated visitor opens the root URL
- **WHEN** an authenticated visitor navigates to `/`
- **THEN** the visitor sees the landing page and can still reach the authenticated admin area

### Requirement: Landing page communicates the product value
The landing page SHALL prominently present the pick line "Design once, use indefinitely" and explain reusable document templates, spreadsheet-based generation, approval and signature workflows, and QR-backed verification.

#### Scenario: Visitor reads the product overview
- **WHEN** a visitor views the landing page
- **THEN** the page contains the exact pick line and a distinct explanation of each core feature

### Requirement: Landing page provides product navigation
The landing page SHALL provide a clear action for signing in and a clear path to the existing public document verification experience.

#### Scenario: Visitor chooses to sign in
- **WHEN** a visitor activates the sign-in action
- **THEN** the visitor is taken to `/login`

#### Scenario: Visitor chooses to verify a document
- **WHEN** a visitor activates the document verification action
- **THEN** the visitor is taken to the existing verification flow or its entry point without requiring admin authentication

### Requirement: Existing application entry points remain available
Adding the landing page SHALL preserve access to the authenticated admin dashboard under `/dashboard` and the token-based public verification route under `/verify/:verificationToken`.

#### Scenario: Existing admin route is opened
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the user sees the existing dashboard experience

#### Scenario: Existing verification link is opened
- **WHEN** a visitor navigates to a valid `/verify/:verificationToken` URL
- **THEN** the visitor sees the existing document verification experience without being sent through the admin login guard