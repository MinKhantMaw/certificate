## Why

Administrators must currently infer the required spreadsheet columns before importing documents. Providing a template-specific sample workbook lets them start from the exact field structure their selected template requires and reduces avoidable validation errors.

## What Changes

- Add a download action for each document template that generates an Excel workbook for that template.
- Populate the workbook header row only from the template's configured text-field keys.
- Make the downloaded workbook reflect the exact data fields defined by its template.
- Validate uploaded spreadsheet rows only against fields configured by the selected template.
- Add automated coverage for template-specific workbook generation and download behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `direct-certificate-upload`: Provide a template-specific sample spreadsheet that matches the direct document import field requirements.

## Impact

- Affected UI: document template list actions and the direct document import workflow.
- Affected client utilities: template-key extraction, workbook creation, and spreadsheet row validation using the existing `xlsx` dependency.
- Affected tests: template page and spreadsheet import utility coverage.