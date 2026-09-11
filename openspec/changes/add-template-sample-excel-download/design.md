## Context

The direct import page uses `getTemplateKeys` to determine which text-field values an uploaded workbook must provide. Document template cards currently expose editing and deletion actions only. The client already includes the `xlsx` package for parsing uploads.

## Goals / Non-Goals

**Goals:**
- Generate a client-side `.xlsx` sample whose headers match the selected template exactly.
- Keep the sample generation logic testable without rendering the templates page.
- Put the download action alongside each template, where administrators choose a design before preparing import data.

**Non-Goals:**
- Add server-side file generation, stored sample files, or new API endpoints.
- Populate the workbook with example recipients.
- Support export formats other than `.xlsx`.

## Decisions

### Generate one empty worksheet in the browser

Create a small import utility that derives a unique ordered header list and creates a one-worksheet `.xlsx` workbook using the existing `xlsx` dependency. The browser download is triggered directly from the template card action.

This avoids persistence and a server endpoint for a file that is deterministic from the template layout. A static sample file per template was rejected because it becomes stale whenever a template changes.

### Use only configured template fields

Use distinct normalized template text-field keys in layout order. The sample must not add `recipient_name`, `email`, or any other import fields that the template does not define.

This reflects the template's visible data contract without silently adding fields. Templates that must support direct import can define the importer-required recipient and email keys themselves. Duplicate keys are omitted to prevent ambiguous headers.

### Validate only selected-template fields

Use the same template key list for validation and sample generation. Do not apply required-field, format, or duplicate checks to canonical columns unless those fields are configured by the template.

This keeps validation consistent with the sample file. The document persistence model retains canonical fields for existing views, but they can remain empty when the selected template does not define them.

### Keep workbook generation separate from the page component

The header derivation and workbook construction will live in a focused utility, while the template page handles the click action and user-visible download metadata. Unit tests can inspect the generated workbook and headers; page tests can assert that the action invokes the download path.

Embedding the logic in `DocumentTemplates` was rejected because it would make spreadsheet behavior harder to test and reuse.

## Risks / Trade-offs

- [Template field names may contain characters unsuitable for a file name] -> Generate the file name from a sanitized template name while leaving header keys unchanged.
- [A template without fields produces an empty worksheet] -> Keep the generated workbook valid and let the import workflow continue to reject files without data rows.
- [Layouts can contain duplicated or whitespace-padded keys] -> Reuse normalized template-key extraction and de-duplicate headers before workbook generation.

## Migration Plan

1. Release the client-side utility and template-card download action together.
2. Existing templates require no data migration because their layouts already contain the field keys used by import validation.
3. Roll back by removing the template-card action; no generated files or persisted data require cleanup.