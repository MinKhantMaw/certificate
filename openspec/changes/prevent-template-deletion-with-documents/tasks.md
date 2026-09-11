## 1. Guard Template Deletion

- [x] 1.1 Update the template deletion service to detect any persisted document whose `documentTemplateId` matches the target, throw a stable in-use error before mutation, and verify the existing storage tests pass.
- [x] 1.2 Preserve the current deletion behavior for an unused template and verify the template cache and persisted template storage no longer contain it after a successful deletion.

## 2. Surface Deletion Errors

- [x] 2.1 Catch template deletion failures in the template management page, set the page error, and avoid refreshing away the protected template; verify the UI keeps the template visible and shows the in-use message.

## 3. Regression Coverage

- [x] 3.1 Add service-level coverage for valid, revoked, pending, and other document references, verifying rejected deletion leaves both documents and the template unchanged.
- [x] 3.2 Add template-management coverage for rejected and successful deletion flows, then verify the focused test suite and TypeScript check pass.