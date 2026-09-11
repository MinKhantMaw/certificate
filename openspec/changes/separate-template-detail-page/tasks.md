## 1. Template Detail Routing

- [x] 1.1 Add a lazy-loaded, authenticated route for an individual template and verify direct navigation resolves the detail page for a known template id.
- [x] 1.2 Update the Templates page to link each template summary to its detail route and remove inline sample-download, edit, and delete controls; verify list items retain summary information and a detail navigation control.
- [x] 1.3 Remove existing-template editing state from the Templates page while retaining the new-template workflow; verify existing template cards only navigate to details.

## 2. Template Detail Experience

- [x] 2.1 Create the template detail page that initializes templates, loads the route-selected template, and shows a return link plus an unavailable-template state; verify both known and unknown template ids render correctly.
- [x] 2.2 Render template name, description, status, visual preview, and layout-derived dynamic field names with an empty-fields state; verify templates with and without configured text fields.
- [x] 2.3 Render the existing canvas editor on the detail page with the selected template's data, validation, and background-upload state; verify validated edits persist and refresh the displayed details.
- [x] 2.4 Preserve guarded deletion by confirming first, showing storage failures in place, and returning to the Templates list after success; verify both referenced and unreferenced template outcomes.

## 3. Automated Verification

- [x] 3.1 Update template list tests to verify detail navigation and the absence of inline management controls.
- [x] 3.2 Update template detail page tests to cover metadata, fields, missing templates, canvas editing and persistence, sample download, and guarded deletion.
- [x] 3.3 Run the focused template page test files and the full project test suite; verify all pass.