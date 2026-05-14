# Security Specification for MASS Management System

## 1. Data Invariants
- A task must have a unique ID.
- Task items must have critical fields like `cid` or `surveyId`.
- Master data controls the options available in the UI.

## 2. Global Safety Net
- Default deny for all unspecified paths.
- Authenticated users can access the system.

## 3. The "Dirty Dozen" Payloads (Examples to Reject)
1. Task without a CID (Integration Failure).
2. Task with a 1MB string in the status field (Resource Poisoning).
3. Modifying `createdAt` after initial creation (Immortality Breach).
4. ...and more in the actual rules.

## 4. Test Runner
We will use `@firebase/rules-unit-testing` patterns in our logic.
