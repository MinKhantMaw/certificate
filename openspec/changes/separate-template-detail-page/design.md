## Context

See `proposal.md` for motivation. `DocumentTemplates` currently owns template creation, editing, listing, sample-download, and deletion in one component. Templates are persisted through the existing browser-backed `storage` service, and `App.tsx` already uses parameterized detail routes for documents.

## Goals / Non-Goals

**Goals:**
- Add a stable detail route for one template.
- Relocate existing per-template actions from the list into the detail view.
- Preserve current template storage behavior and deletion protection.
- Cover list navigation and detail-page actions with focused UI tests.

**Non-Goals:**
- Change template data structures, background asset handling, or sample workbook contents.
- Change document import behavior or document detail pages.
- Introduce server-side template APIs or role changes.

## Decisions

### Use a parameterized template route and page component

Add a dedicated authenticated route beneath the existing template route, using a template identifier to load one template after template initialization. This follows the document detail route pattern and supports direct navigation and a useful unavailable-template state.

Alternative considered: keep the detail UI in an expandable card or modal on the list. Rejected because it does not create an addressable page and continues to couple list rendering with management behavior.

### Keep template editing on the detail page

The template detail page will own the selected template's editor state and render the existing `TemplateBuilder` there. It will reuse the existing validation, background-upload coordination, and storage update behavior. The Templates page will remain responsible for creating new templates and navigating to existing details.

Alternative considered: redirect to the Templates page with an edit query. Rejected because it separates editing from the template context and contradicts the request to place the canvas editor on the detail page.

### Reuse template layout helpers for details

The detail page will derive displayed field names from the template layout using the existing layout-key utility, and it will render the stored preview image or existing visual fallback. This keeps field ordering and duplicate handling consistent with imports and document views.

Alternative considered: add stored field metadata to `DocumentTemplate`. Rejected because configured fields are already the source of truth in the layout and a second representation could drift.

### Move actions rather than remove their behavior

Sample workbook generation and deletion will remain connected to their existing utilities and storage methods, but only appear on the template detail page. After successful deletion, navigation returns to the list; failures remain visible on the detail page.

Alternative considered: retain actions in both places. Rejected because it conflicts with the goal of simplifying the list and leaves destructive actions where the change explicitly removes them.

## Risks / Trade-offs

- [Deep-linking before templates initialize can briefly produce an unavailable state] → Wait for template initialization before showing the not-found state.
- [The detail page combines preview, metadata, and a canvas editor] → Keep the editor below the summary and reuse its existing loading and upload states.
- [Existing tests call list-card actions directly] → Replace those assertions with list-navigation tests and move action coverage to focused detail-page tests.

## Migration Plan

1. Deploy the new route and detail page with existing storage data unchanged.
2. Update the template list to link to the new route and remove inline actions and existing-template editing state.
3. Verify existing template records, including records without layouts or preview images, render safely in the detail page.
4. Roll back by restoring inline list actions and removing the route; no persisted-data migration is required.