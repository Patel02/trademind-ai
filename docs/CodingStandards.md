# TradeMind AI — Coding Standards

This document establishes the strict coding standards and engineering rules enforced in the TradeMind AI codebase.

---

## 1. File & Component Constraints

*   **Component Size:** No React or UI component may exceed **300 lines of code**. Large components must be decomposed into sub-components or custom hooks.
*   **Function Size:** No single function or method may exceed **50 lines of code**. Split large procedural functions into descriptive, helper sub-methods.
*   **Database Isolation:** Absolutely **no direct database or Supabase calls from UI components**. All queries and mutations must flow through a dedicated service or API facade layer.
*   **API Validation:** Every incoming payload to an API endpoint must be parsed and validated using a Zod schema. No unvalidated parameters may be processed.

---

## 2. TypeScript Rules

*   **Strict Mode:** TypeScript `strict` mode must be enabled globally (`"strict": true` in `tsconfig.json`).
*   **No Explicit 'any':** The use of the `any` type is strictly forbidden. Every variable, argument, and return type must have a defined type interface or union.
*   **Null Checks:** Always enforce strict null check validations (`strictNullChecks`).

---

## 3. Formatting & Code Style

*   Use descriptive, camelCase names for variables and functions.
*   Use PascalCase for React components, types, and interfaces.
*   Enforce single responsibility principle (SRP) for services and modules.
*   Keep files structured, imports grouped (third-party first, followed by internal absolute imports).
