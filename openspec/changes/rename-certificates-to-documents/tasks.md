## 1. Rename the document domain model

- [x] 1.1 Rename certificate-related TypeScript types, fields, storage APIs, helpers, hooks, components, files, imports, and test names to document equivalents; verify `npm run lint` passes with no certificate-named source identifiers.
- [x] 1.2 Rename certificate-specific local-storage keys and migrate legacy stored records and fields to document equivalents idempotently; verify automated tests preserve a legacy record and remove the legacy key.
- [x] 1.3 Update demo data, audit entities, and import generation to create document-named records and identifiers; verify direct generation produces valid documents with unique document numbers, short IDs, and verification URLs.

## 2. Rename routes and product language

- [x] 2.1 Replace certificate list, detail, and template paths with document-named routes and update all navigation links; verify certificate-named paths are unavailable and document-named paths render the expected pages.
- [x] 2.2 Rename all administrator page, control, alert, empty-state, preview, and template text from certificate to document; verify a repository search finds no certificate wording in active client UI source.
- [x] 2.3 Rename public verification page wording and states to document verification, document verified, document revoked, and document not found; verify a valid token renders the document verification state.

## 3. Update the verification API

- [x] 3.1 Rename verification API variables, response fields, and errors from certificate to document; verify the endpoint returns a document-shaped payload for a known token and a document-not-found error for an unknown token.
- [x] 3.2 Update client verification parsing and tests to consume the document API contract; verify local and API-backed verification render the same document details.

## 4. Test and validate the migration

- [x] 4.1 Update template CRUD, direct import, generation, and retired-feature tests to use document terminology and document storage contracts; verify `npm test` passes.
- [x] 4.2 Add route and legacy-storage migration regression tests; verify document routes work, certificate routes do not resolve, and a legacy local-storage record remains accessible after migration.
- [x] 4.3 Run a repository-wide case-variant search for `certificate`; verify remaining matches are only intentional historical migration compatibility or archived documentation.
- [x] 4.4 Run `npm run lint`, `npm test`, and `npm run build`; verify all commands pass.