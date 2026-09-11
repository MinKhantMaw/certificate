## Context

The proposal targets a shared preview path used by document detail, import preview, and verification. Today `DocumentDetail` owns a `showQr` state and passes it into `DocumentPreview`; both the legacy preview and dynamic layout renderer use that flag, while print readiness also waits based on the flag. Template layouts already identify QR elements with `type: "qr"`, so the layout is the existing source of truth for placement.

## Goals / Non-Goals

**Goals:**

- Derive QR visibility from the loaded template layout in every preview context.
- Remove the detail-page toggle and keep print readiness aligned with whether a QR element exists.
- Preserve existing QR URL generation, verification navigation, template loading errors, and revoke behavior.
- Add focused regression coverage for both QR-present and QR-absent layouts.

**Non-Goals:**

- Changing the template builder's QR element type or placement controls.
- Changing persisted document fields, verification URLs, QR encoding, or backend endpoints.
- Adding a new per-document override or automatically inserting QR elements into existing templates.

## Decisions

1. **Use the template layout as the visibility source.** Compute whether the selected layout contains a QR element and use that result for rendering and print readiness. This avoids duplicated UI state and makes the output match the saved design. The alternative is retaining `showQr` with a default derived from the layout, but that would preserve a conflicting override and the removed workflow.

2. **Keep QR rendering inside the configured element.** Dynamic previews should render the existing QR component only for `qr` elements; the legacy fallback should not invent a QR because it has no template QR element. This preserves coordinates and prevents QR output from appearing in templates that do not request it. The alternative is a fixed fallback QR, which would violate template-driven behavior.

3. **Pass explicit QR requirement to printing, not UI visibility state.** The print button should wait only when the selected template requires a QR, while still allowing immediate printing for templates without one. This separates readiness from the removed toggle. The alternative is always waiting for QR generation, which adds unnecessary delay and failure states.

4. **Test behavior at the detail and preview boundaries.** Update the existing detail tests to assert the toggle is absent and add layout cases that distinguish QR-present from QR-absent rendering/readiness. This catches regressions in both the user-facing action set and shared preview behavior.

## Risks / Trade-offs

- [Existing templates without QR elements lose the previously default QR] -> This is intentional and documented as a behavior change; administrators can add a QR element in the template builder when verification QR output is required.
- [A template loads after the detail header renders] -> Keep the existing template loading state and derive QR requirement from the loaded layout; do not assume a QR while the template is unavailable.
- [Legacy documents without an associated layout may change appearance] -> Treat them as having no template-defined QR and preserve their existing non-layout fallback preview behavior.

## Migration Plan

No data migration is required. Deploy the UI change, then review active templates that require verification QR output and add a QR element where missing. Rollback consists of reverting the UI change; persisted templates and documents remain compatible.