# Current Project Features and Workflow

This document describes only the implementation that exists in the current repository as of 2026-09-22. It does not describe planned or future functionality.

## 1. Project overview and technology stack

### Product
This project is a local-first certificate and document management prototype for E-Certificate. It includes:

- public document verification pages
- template design and editing
- document generation from Excel imports
- document review / approval workflow
- per-template document listing and filtering
- QR-backed verification workflow
- local demo data initialization

### Technology stack
- Frontend: React 19, Vite, TypeScript
- Routing: react-router-dom
- UI styling: Tailwind CSS via @tailwindcss/vite
- Drawing/editor: Konva + react-konva
- QR generation: qrcode.react
- Excel parsing: xlsx
- Image export / ZIP: html-to-image + jszip
- Persistence: browser localStorage for application state
- Serverless API: Vercel-style API functions under api/
- Template asset storage: Node filesystem in storage/templates
- Testing: Vitest + React Testing Library / jsdom

### Main implementation files
- App bootstrap: [src/App.tsx](../src/App.tsx)
- State/data layer: [src/services/storage.ts](../src/services/storage.ts)
- Type model: [src/types/index.ts](../src/types/index.ts)
- Route protection: [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)
- Sidebar layout: [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx)
- Template editor: [src/components/TemplateBuilder.tsx](../src/components/TemplateBuilder.tsx)
- Document preview: [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx)
- API routes: [api/templates/index.ts](../api/templates/index.ts), [api/templates/upload.ts](../api/templates/upload.ts), [api/verify/[verificationToken].ts](../api/verify/[verificationToken].ts)

---

## 2. Complete list of existing features

### A. Public landing page
- Purpose: marketing / entry page for the product.
- Implementation: [src/pages/Landing.tsx](../src/pages/Landing.tsx)
- Status: Working (UI only, not connected to backend data)

### B. Login and session handling
- Purpose: sign-in page and demo auth persistence.
- Implementation: [src/pages/Login.tsx](../src/pages/Login.tsx), [src/services/storage.ts](../src/services/storage.ts)
- Status: Working
- Notes: login validates demo emails and password, then writes user data to localStorage under cms_auth.

### C. Protected admin shell and navigation
- Purpose: auth gate and app layout with sidebar/topbar.
- Implementation: [src/App.tsx](../src/App.tsx), [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx), [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)
- Status: Working

### D. Dashboard
- Purpose: status overview, quick actions, recent documents, recent imports.
- Implementation: [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
- Status: Working

### E. Template management library
- Purpose: list templates, create new template, inspect detail page, update names/description/layout, delete template if it is not used by existing documents.
- Implementation: [src/pages/DocumentTemplates.tsx](../src/pages/DocumentTemplates.tsx), [src/pages/TemplateCreate.tsx](../src/pages/TemplateCreate.tsx), [src/pages/TemplateDetail.tsx](../src/pages/TemplateDetail.tsx), [src/services/storage.ts](../src/services/storage.ts)
- Status: Partially working
- Notes: creation and editing are implemented; template deletion is blocked when referenced by a document.

### F. Drag-and-drop / visual template builder
- Purpose: create/edit template canvas with resizable/positionable elements; add text, plain text, image, QR, shape capabilities; background image upload; alignment guides; preview mode.
- Implementation: [src/components/TemplateBuilder.tsx](../src/components/TemplateBuilder.tsx)
- Status: Working
- Notes: uses Konva and supports custom canvas size/orientation, element editing, image optimization, and preview mode.

### G. Dynamic template keys and value resolution
- Purpose: resolve values from template placeholder keys to document data.
- Implementation: [src/utils/index.ts](../src/utils/index.ts), [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx), [src/pages/DocumentDetail.tsx](../src/pages/DocumentDetail.tsx), [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx)
- Status: Working

### H. Excel import workflow
- Purpose: upload an Excel file, match template keys, validate cells, preview imported rows, then generate document records.
- Implementation: [src/pages/ImportExcel.tsx](../src/pages/ImportExcel.tsx), [src/utils/importRows.ts](../src/utils/importRows.ts), [src/services/storage.ts](../src/services/storage.ts)
- Status: Working
- Notes: validates rows, enforces file size and row limits, and creates ImportBatch records.

### I. Import history and batch tracking
- Purpose: list all import batches with template name, valid/total rows, submitted date.
- Implementation: [src/pages/ImportHistory.tsx](../src/pages/ImportHistory.tsx), [src/services/storage.ts](../src/services/storage.ts), [src/types/index.ts](../src/types/index.ts)
- Status: Working

### J. Document list and filtering
- Purpose: filter and sort documents by template, status and dynamic fields; slide view and table view; revoke or delete actions. Bulk export of all matching document previews as a ZIP image pack.
- Implementation: [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx), [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx), [src/services/storage.ts](../src/services/storage.ts)
- Status: Partially working
- Notes: table/filter functionality and export are implemented; there are known issues in real rendering/export logic and some actions rely on local state.

### K. Document detail page
- Purpose: show document metadata, mapped dynamic fields, preview, revoke, delete, and download image.
- Implementation: [src/pages/DocumentDetail.tsx](../src/pages/DocumentDetail.tsx), [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx)
- Status: Working

### L. Verification page for public docs
- Purpose: public lookup by verification token; checks deleted tokens and local / API fallback.
- Implementation: [src/pages/VerifyDocument.tsx](../src/pages/VerifyDocument.tsx), [src/services/storage.ts](../src/services/storage.ts), [api/verify/[verificationToken].ts](../api/verify/[verificationToken].ts)
- Status: Working
- Notes: app first checks local storage, then attempts API fetch, then falls back to demo data.

### M. Approval workflow
- Purpose: approver queue; approve/reject a document; mark final document valid or rejected; close remaining pending approvals for the same document.
- Implementation: [src/pages/Approvals.tsx](../src/pages/Approvals.tsx), [src/services/storage.ts](../src/services/storage.ts)
- Status: Working
- Notes: implemented as a single-approval model by design; first approver finalizes the document and updates other pending approval records.

### N. Signature profile upload
- Purpose: upload or remove a user signature image; used when an approver approves a document.
- Implementation: [src/pages/SignatureProfile.tsx](../src/pages/SignatureProfile.tsx), [src/services/storage.ts](../src/services/storage.ts), [src/types/index.ts](../src/types/index.ts)
- Status: Working
- Notes: route exists but is effectively inactive in the sidebar nav and is not part of the visible admin route set.

### O. QR verification link generation
- Purpose: create verification URL and encrypted QR equivalent where needed.
- Implementation: [src/services/encryptLink.ts](../src/services/encryptLink.ts), [src/hooks/useEncryptedQr.ts](../src/hooks/useEncryptedQr.ts), [src/utils/index.ts](../src/utils/index.ts)
- Status: Partially working
- Notes: fallback to document.verificationUrl when API is missing; actual external encryption endpoint is conditional on VITE_ENCRYPT_API_URL.

### P. Demo data seeding
- Purpose: initialize default users, template, and two example documents.
- Implementation: [src/services/storage.ts](../src/services/storage.ts), [src/App.tsx](../src/App.tsx)
- Status: Working

### Q. Server-side template asset API
- Purpose: save or list template files and upload image assets to disk under storage/templates.
- Implementation: [api/templates/index.ts](../api/templates/index.ts), [api/templates/upload.ts](../api/templates/upload.ts)
- Status: UI Only / Partial
- Notes: API exists but no frontend route currently uses it directly for template saves; the main app uses localStorage instead.

### R. User management placeholder
- Purpose: placeholder route for users management.
- Implementation: [src/App.tsx](../src/App.tsx)
- Status: Missing / UI only placeholder

### S. Settings placeholder
- Purpose: placeholder route for settings.
- Implementation: [src/App.tsx](../src/App.tsx)
- Status: Missing / UI only placeholder

---

## 3. All pages/routes

### Public routes
- / : Landing page — [src/pages/Landing.tsx](../src/pages/Landing.tsx)
- /login : Login page — [src/pages/Login.tsx](../src/pages/Login.tsx)
- /verify/:verificationToken : Public verification page — [src/pages/VerifyDocument.tsx](../src/pages/VerifyDocument.tsx)

### Protected routes under AdminLayout
- /dashboard : Dashboard — [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
- /document-templates : Template library — [src/pages/DocumentTemplates.tsx](../src/pages/DocumentTemplates.tsx)
- /document-templates/new : New template page — [src/pages/TemplateCreate.tsx](../src/pages/TemplateCreate.tsx)
- /document-templates/:id : Template detail/edit page — [src/pages/TemplateDetail.tsx](../src/pages/TemplateDetail.tsx)
- /approvals : Approver queue — [src/pages/Approvals.tsx](../src/pages/Approvals.tsx)
- /profile : Signature profile — [src/pages/SignatureProfile.tsx](../src/pages/SignatureProfile.tsx)
- /import : Excel import — [src/pages/ImportExcel.tsx](../src/pages/ImportExcel.tsx)
- /imports : Import history — [src/pages/ImportHistory.tsx](../src/pages/ImportHistory.tsx)
- /documents : Document list — [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx)
- /documents/:id : Document detail — [src/pages/DocumentDetail.tsx](../src/pages/DocumentDetail.tsx)

### Placeholder routes
- /users : user management placeholder — [src/App.tsx](../src/App.tsx)
- /settings : settings placeholder — [src/App.tsx](../src/App.tsx)

### Fallback route
- * : redirects to /dashboard — [src/App.tsx](../src/App.tsx)

---

## 4. All user roles and permissions

### Roles defined
- ADMIN
- TRAINER
- APPROVER

Defined in: [src/types/index.ts](../src/types/index.ts)

### Permission model in code
- ProtectedRoute checks authentication and optional roles: [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)
- Authentication is read from localStorage key cms_auth in [src/services/storage.ts](../src/services/storage.ts)
- The login form accepts role selection in code but the UI currently comments the role selector out and defaults to a chosen role in the component state: [src/pages/Login.tsx](../src/pages/Login.tsx)

### Current effective behavior
- Any authenticated user can access all protected routes except those explicitly gated by role.
- /approvals is guarded with roles={["APPROVER"]} — only approvers can access it: [src/App.tsx](../src/App.tsx)
- The sidebar nav items only show the standard admin sections and intentionally comments out the approver-only entries, so the visible UI does not surface approvals navigation: [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx)

### Demo credentials currently implemented
- admin@example.com / admin123 -> role ADMIN
- trainer@example.com / admin123 -> role TRAINER
- approver@example.com / admin123 -> role APPROVER

Implemented in: [src/pages/Login.tsx](../src/pages/Login.tsx) and demo seeding in [src/services/storage.ts](../src/services/storage.ts)

---

## 5. Complete workflow for each major feature

### 5.1 Login and session workflow
1. User enters email/password on [src/pages/Login.tsx](../src/pages/Login.tsx).
2. The code checks the demo email and password against the selected role.
3. On success, storage.login(...) writes the user object to localStorage cms_auth and navigates to /dashboard.
4. ProtectedRoute reads the user from storage and redirects unauthenticated users to /login.
5. AdminLayout renders the shell and shows the user name/email.

### 5.2 Template creation workflow
1. User opens /document-templates/new.
2. TemplateCreate renders the TemplateBuilder and allows adding elements.
3. User supplies template name + description. Validation runs through validateTemplate from [src/utils/templateValidation.ts](../src/utils/templateValidation.ts).
4. Background uploads are optimized and saved as base64 data URLs.
5. On submit, storage.saveTemplate() writes the new template into localStorage cms_templates and navigates to /document-templates/:id.

### 5.3 Template editing and deletion workflow
1. TemplateDetail loads the template by id through storage.initTemplates().
2. The page displays dynamic fields derived from the template layout keys.
3. The editor reuses the same TemplateBuilder and saves by calling storage.updateTemplate().
4. Delete is blocked if any document references the template; storage.deleteTemplate() throws an error when the template is in use.
5. On success, the page navigates back to the template list.

### 5.4 Excel import workflow
1. User selects a template from the import page.
2. Excel file is read using xlsx and converted into row objects.
3. Each row is normalized by parseImportedRow using the current template key list.
4. The preview page shows validation status, errors and a sample preview for the first row.
5. When user clicks Generate documents, storage.generateDocuments() validates all rows, creates document records, and may request QR URLs for QR-bearing templates.
6. A new ImportBatch is saved to localStorage cms_import_batches.
7. The user is redirected to /documents or shown a success state.

### 5.5 Document generation workflow
1. storage.generateDocuments() selects the active template and checks row validity.
2. It creates an internal shortId + verificationToken + verificationUrl for every document.
3. If the template includes a QR element, it calls requestEncryptedQr() and stores encrypted QR metadata on the document.
4. The documents are appended to localStorage cms_documents and audit logs are written.

### 5.6 Document list workflow
1. DocumentList loads templates and document records.
2. The selected template determines the set of documents and dynamic table columns.
3. Search and status filters are applied against visible dynamic fields.
4. The list can switch between table and slide view.
5. Users may revoke valid documents or delete them; revoke updates document status to REVOKED, delete removes the document and its approval records.
6. Bulk export triggers a ZIP download of rendered document PNGs through html-to-image.

### 5.7 Document detail workflow
1. User opens /documents/:id.
2. The document is loaded from storage and its template is fetched asynchronously.
3. The page displays metadata and mapped fields from the document + template.
4. Print/download button converts the preview into an image by capturing the DOM node.
5. Revoke action sets the document status to REVOKED.
6. Delete action removes the document and navigates back to the document list.

### 5.8 Approval workflow
1. An APPROVER logs in.
2. The Approvals page loads documents where approverId matches the current user and status is PENDING.
3. Approve or reject actions call storage.updateApproval() and then update the underlying document status.
4. The document is set to VALID if approved, REJECTED if rejected.
5. Other pending approvals for the same document are closed with the same decision in the same transaction path.

### 5.9 Verification page workflow
1. The public route /verify/:verificationToken reads the token from the URL.
2. It checks if the token was intentionally deleted via cms_deleted_document_tokens.
3. It looks up the document in localStorage.
4. If not found locally, it calls /api/verify/:token and falls back to demo data if the API fails.
5. The page renders a verification result and the document status: valid, revoked, pending, or not found.

### 5.10 QR workflow
1. Documents that include a QR element in their template generate QR payloads via requestEncryptedQr().
2. If VITE_ENCRYPT_API_URL is configured, app calls the API and uses the returned qrUrl.
3. If the API is not available or returns no usable value, the app falls back to the normal verification URL.
4. DocumentPreview and useEncryptedQr render or retry QR code generation when needed.

---

## 6. Data storage (localStorage, API, database, etc.)

### Primary app storage: browser localStorage
The main app uses localStorage keys defined in [src/services/storage.ts](../src/services/storage.ts):

- cms_users
- cms_templates
- cms_documents
- cms_approvals
- cms_imports
- cms_import_batches
- cms_pending_import_trainees
- cms_audit
- cms_auth
- cms_deleted_document_tokens
- legacy migration key: cms_certificates

This is the active source of truth for the app’s user, document, approval, template, and import data.

### File-based API storage
The Vercel serverless API functions persist template metadata/images to the filesystem under the project’s storage directory:

- [api/templates/index.ts](../api/templates/index.ts) writes template JSON files under storage/templates/<id>/template.json
- [api/templates/upload.ts](../api/templates/upload.ts) stores uploaded asset files under storage/templates/assets

### Verification API fallback
- [api/verify/[verificationToken].ts](../api/verify/[verificationToken].ts) returns static demo verification records by token.
- The frontend verification page calls this API but falls back to local or demo data if the call is unavailable.

### No relational database
There is no PostgreSQL, SQLite, MongoDB, or other database layer in the current project. There is no backend database abstraction beyond localStorage and filesystem-backed API functions.

---

## 7. Important components/services

### Core app shell
- [src/App.tsx](../src/App.tsx): route map, lazy loading, initialization of demo data
- [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx): sidebar layout and authenticated shell
- [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx): auth guard and role guard

### Data/service layer
- [src/services/storage.ts](../src/services/storage.ts): central persistence, migrations, demo data seeding, document generation, approval logic
- [src/types/index.ts](../src/types/index.ts): shared domain models
- [src/utils/index.ts](../src/utils/index.ts): template key resolution, document id helpers, formatters
- [src/utils/importRows.ts](../src/utils/importRows.ts): row normalization and validation
- [src/utils/templateValidation.ts](../src/utils/templateValidation.ts): template form validation
- [src/utils/sampleImportWorkbook.ts](../src/utils/sampleImportWorkbook.ts): sample Excel generation
- [src/utils/templateLayout.ts](../src/utils/templateLayout.ts): default layout creation

### Template and preview layer
- [src/components/TemplateBuilder.tsx](../src/components/TemplateBuilder.tsx): full visual canvas editor
- [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx): renders final certificate preview from template + document data
- [src/hooks/useEncryptedQr.ts](../src/hooks/useEncryptedQr.ts): QR generation readiness state and retries
- [src/services/encryptLink.ts](../src/services/encryptLink.ts): calls encryption API or falls back to verification URL

### Page-level modules
- [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
- [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx)
- [src/pages/DocumentDetail.tsx](../src/pages/DocumentDetail.tsx)
- [src/pages/ImportExcel.tsx](../src/pages/ImportExcel.tsx)
- [src/pages/ImportHistory.tsx](../src/pages/ImportHistory.tsx)
- [src/pages/TemplateCreate.tsx](../src/pages/TemplateCreate.tsx)
- [src/pages/TemplateDetail.tsx](../src/pages/TemplateDetail.tsx)
- [src/pages/Approvals.tsx](../src/pages/Approvals.tsx)
- [src/pages/VerifyDocument.tsx](../src/pages/VerifyDocument.tsx)
- [src/pages/Login.tsx](../src/pages/Login.tsx)
- [src/pages/SignatureProfile.tsx](../src/pages/SignatureProfile.tsx)

---

## 8. Feature status

### Working
- landing page: [src/pages/Landing.tsx](../src/pages/Landing.tsx)
- login/session: [src/pages/Login.tsx](../src/pages/Login.tsx), [src/services/storage.ts](../src/services/storage.ts)
- dashboard: [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
- template builder/editor: [src/components/TemplateBuilder.tsx](../src/components/TemplateBuilder.tsx)
- Excel import validation and generation: [src/pages/ImportExcel.tsx](../src/pages/ImportExcel.tsx)
- import history: [src/pages/ImportHistory.tsx](../src/pages/ImportHistory.tsx)
- document detail and preview: [src/pages/DocumentDetail.tsx](../src/pages/DocumentDetail.tsx), [src/components/DocumentPreview.tsx](../src/components/DocumentPreview.tsx)
- public verification page: [src/pages/VerifyDocument.tsx](../src/pages/VerifyDocument.tsx)
- approval queue: [src/pages/Approvals.tsx](../src/pages/Approvals.tsx)
- demo data seeding: [src/services/storage.ts](../src/services/storage.ts)

### Partially working
- template library and editing: [src/pages/DocumentTemplates.tsx](../src/pages/DocumentTemplates.tsx), [src/pages/TemplateDetail.tsx](../src/pages/TemplateDetail.tsx)
- QR code generation: [src/services/encryptLink.ts](../src/services/encryptLink.ts), [src/hooks/useEncryptedQr.ts](../src/hooks/useEncryptedQr.ts)
- document list metadata, filters, and bulk image export: [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx)
- server-side template asset API: [api/templates/index.ts](../api/templates/index.ts), [api/templates/upload.ts](../api/templates/upload.ts)

### Broken
- No explicit broken feature was confirmed by the repository tests as a complete hard failure, but there are known implementation weaknesses and missing/incomplete behaviors described below.
- There is at least one failing test in the current suite: the TemplateDetail save flow currently fails in the automated tests. This was confirmed by running the project tests.

### UI only
- landing page marketing material: [src/pages/Landing.tsx](../src/pages/Landing.tsx)
- placeholder routes /users and /settings: [src/App.tsx](../src/App.tsx)
- server-side API is present but the app does not fully operate with it for templates; it still relies on localStorage for the main product flow.

### Missing
- full user management system
- settings feature
- real database-backed persistence
- full production-grade backend auth/authorization
- explicit trainer-only workflows
- true multi-approver process beyond single-approval finalization
- direct use of server-side template storage in the main app flow

---

## 9. Existing bugs/problems

### 1. TemplateDetail save test failure
Evidence: the project test suite currently reports a failing case for TemplateDetail > saves validated detail-page edits.
Relevant implementation: [src/pages/TemplateDetail.tsx](../src/pages/TemplateDetail.tsx)

### 2. Local auth and role checks are demo-only
The app authenticates against hardcoded demo emails and passwords rather than a real auth system. This is not production-safe.
Relevant files: [src/pages/Login.tsx](../src/pages/Login.tsx), [src/services/storage.ts](../src/services/storage.ts)

### 3. Role access is inconsistent with navigation
The route guard allows APPROVER access to /approvals, but the sidebar does not include that route for approvers, so the approval workflow is effectively hard to discover in the UI.
Relevant files: [src/App.tsx](../src/App.tsx), [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx)

### 4. User profile route exists but is not enabled in the visible admin nav
The signature profile route is implemented, but not part of the active nav items.
Relevant file: [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx), [src/pages/SignatureProfile.tsx](../src/pages/SignatureProfile.tsx)

### 5. Some template and document features rely on localStorage and never persist to a server
This makes the app effectively a prototype; there is no central backend state.
Relevant file: [src/services/storage.ts](../src/services/storage.ts)

### 6. import/export and preview logic are not fully robust
The export logic depends on DOM rendering with html-to-image and assumes elements are present in the page. This can be sensitive to timing and rendering state.
Relevant file: [src/pages/DocumentList.tsx](../src/pages/DocumentList.tsx)

### 7. Fallback verification API behavior is partial
The verification page tries to fetch from /api/verify/:token but also falls back to localStorage or demo data; it is designed as a demo/local system rather than a fully integrated public verification backend.
Relevant files: [src/pages/VerifyDocument.tsx](../src/pages/VerifyDocument.tsx), [api/verify/[verificationToken].ts](../api/verify/[verificationToken].ts)

### 8. Incomplete or commented-out functionality in the UI
The app contains commented-out role selector, users nav, settings nav, approvals nav, and signature profile nav items. These indicate unfinished or disabled features.
Relevant files: [src/pages/Login.tsx](../src/pages/Login.tsx), [src/components/AdminLayout.tsx](../src/components/AdminLayout.tsx), [src/App.tsx](../src/App.tsx)

### 9. Some status values and dynamic data mapping are inconsistent with older migration keys
The storage layer contains migration logic for legacy certificate fields and older approval keys, indicating multiple data shapes and backward compatibility concerns.
Relevant file: [src/services/storage.ts](../src/services/storage.ts)

---

## 10. Missing or incomplete features

- Real authentication and authorization backend
- User management CRUD
- Settings page
- Team or permission assignments beyond simple roles
- Actual database-backed document persistence
- Multi-step approver workflow with multiple approvers required
- Template asset persistence connected to the main app workflow instead of a separate API+localStorage mix
- File storage for uploaded template assets in a consistently used app layer
- Audit dashboard or workflow analytics beyond basic logs
- Real server-side verification store with persisted document state and deletions
- Production-grade API validation, security, and error handling

---

## Current implementation summary

The repository is a functional demo/prototype for document lifecycle management. It includes a browser-based admin system for templates, Excel imports, document approval, and verification. The app is primarily driven by localStorage with a Vercel-style API layer for template assets and verification fallback, but it is not a production backend architecture. The current implementation includes a significant amount of working UI and logic, while several roles, flows, and screens remain partially implemented or intentionally placeholder-only.
