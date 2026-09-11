## Why

Template information and administrative controls are crowded into the Templates list cards. Administrators need a focused template page for reviewing and managing one template without turning the list into an action panel.

## What Changes

- Add a dedicated page for viewing an individual document template and its details.
- Make each template in the Templates list open its dedicated detail page.
- Move template-specific actions, including sample Excel download, canvas editing, and deletion, from list cards to the template detail page.
- Keep the Templates list focused on finding and selecting templates instead of exposing destructive or secondary actions inline.

## Capabilities

### New Capabilities
- `template-detail`: View an individual template and access its management actions from a dedicated route.

### Modified Capabilities

- None.

## Impact

- Affected UI: `src/pages/DocumentTemplates.tsx`, the template detail page and editor, and `src/App.tsx` routing.
- Affected tests: template list tests and new template detail page coverage.
- Existing browser storage template APIs and sample workbook generation remain in use; no external API or dependency changes are expected.