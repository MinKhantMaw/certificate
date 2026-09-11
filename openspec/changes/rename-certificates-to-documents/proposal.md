## Why

The product presents documents to administrators while its routes, types, storage, API contracts, and public verification UI still use certificate terminology. A complete rename will make the product language consistent and remove the mixed vocabulary.

## What Changes

- **BREAKING** Rename all user-facing certificate language to document language, including the public verification experience.
- **BREAKING** Move certificate list, detail, template, and verification routes to document-named paths.
- **BREAKING** Rename source files, React components, TypeScript types, storage APIs and keys, utility helpers, tests, and API payload identifiers from certificate to document.
- Migrate browser storage from retired certificate keys and object fields so existing records remain available as documents.
- Update the verification API to return document-named payloads and errors.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `direct-certificate-upload`: Direct imports create and present documents using document terminology and routes.
- `training-program-retirement`: Retired-feature and direct-import behavior refer to documents throughout the product.

## Impact

- Affected client application: routes, pages, components, services, hooks, types, utilities, tests, and user-facing text.
- Affected server API: verification response payloads and error messages.
- Browser storage requires one-way migration from certificate-named keys and fields to document-named equivalents.