# Specification

## Summary
**Goal:** Fix the “New Visit Entry” save flow so valid entries save reliably, and any save failures surface as clear English UI errors instead of silent console-only failures.

**Planned changes:**
- Make the “New Entry” submit flow consistently handle success vs failure: show a success message and refresh “My Entries” on success; show a visible English error message and keep form values on failure.
- Add/adjust validation for Hospital Charges (Rs) and Medicine Charges (Rs) to prevent or clearly reject non-integer inputs (e.g., decimals) that can trigger BigInt conversion errors.
- Ensure create/edit mutation errors (including backend traps such as authorization/type errors) propagate to the UI as sanitized, user-friendly English messages (no raw stack traces), and prevent showing success state when a mutation fails.

**User-visible outcome:** Submitting a valid new visit entry shows a success message and the entry appears in “My Entries”; if saving fails for any reason, the user sees a clear English error message and their entered values remain in the form.
