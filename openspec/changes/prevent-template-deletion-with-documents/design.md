## Context

The current template management page confirms deletion and delegates directly to the local storage service. The storage service persists templates and documents separately, while each generated document retains an optional `documentTemplateId`. No deletion guard currently checks that relationship. See proposal.md for the motivation and template-lifecycle/spec.md for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Make the storage deletion operation atomic from the caller's perspective: a referenced template is not removed and an explicit error is raised.
- Count every persisted document reference, regardless of document status.
- Keep the UI list unchanged after a rejected deletion and show the failure reason.
- Preserve the existing successful deletion flow for unused templates.

**Non-Goals:**

- Changing document generation, document statuses, or template editing behavior.
- Replacing templates on existing documents or introducing template versioning.
- Adding a new server persistence contract; the current browser flow uses the local storage service and the API template delete route is not used by the page.

## Decisions

### Enforce the invariant in the storage service

`deleteTemplate` will inspect persisted documents through the existing document accessor before mutating the template cache or `cms_templates` key. If a document has the target `documentTemplateId`, it will throw a stable, user-facing error. This protects callers beyond the current page and ensures the template and its references cannot become inconsistent.

Alternative considered: checking only in `DocumentTemplates`. Rejected because any future caller could bypass the UI guard.

### Treat all document statuses as references

The check will not filter by status. Revoked, rejected, pending, and valid documents remain historical records that can need template data for detail, preview, verification, or audit workflows.

Alternative considered: blocking only valid documents. Rejected because it would allow historical documents to lose their rendering dependency.

### Catch deletion errors at the page boundary

The template page will keep its existing confirmation prompt, call the guarded service, and catch failures to set the page error. It will refresh the template list only after a successful deletion, so a rejected operation naturally leaves the protected template visible.

Alternative considered: disabling the delete button based on a precomputed document count. Rejected because a pre-check can become stale and would duplicate the invariant outside the mutation boundary.

## Risks / Trade-offs

- [Risk] Existing persisted documents may omit `documentTemplateId` because of legacy data. -> Mitigation: only references that can be identified by the stored ID can be protected; retain existing missing-template handling and cover the explicit reference path with tests.
- [Risk] `getDocuments()` performs migration and sorting work during deletion checks. -> Mitigation: use the existing accessor for consistency and keep the check to a single `some` lookup; optimize only if measured usage requires it.
- [Risk] The exact error wording becomes part of the UI experience. -> Mitigation: use a clear stable message and assert the meaningful text in service/UI tests rather than coupling tests to incidental rendering details.

## Migration Plan

No data migration is required. Deploy the guarded deletion behavior and add regression coverage. Rollback is limited to reverting the service and page changes; existing templates and documents are not modified by the guard.