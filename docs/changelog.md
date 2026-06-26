# TradeMind AI v1.0 — Changelog Document

All notable changes to the TradeMind AI platform during Sprint 6.4 will be documented in this file.

---

## [1.0.0] — 2026-06-26

### Sprint 6.4: Portfolio Doctor Pro Upgrades

#### Added
*   **Sprint 6.4.1 — Database Setup:**
    *   Created local migration file `supabase_sprint6_4_doctor_pro_schema.sql` defining 7 core tables: `portfolio_snapshots`, `portfolio_health_scores`, `portfolio_sector_analysis`, `portfolio_risk_analysis`, `portfolio_recommendations`, `portfolio_alerts`, and `portfolio_simulations`.
    *   Enabled Row-Level Security (RLS) policies on all tables isolating tenant data.
    *   Added composite query speed indexes for user IDs and recorded dates.
*   **Sprint 6.4.2 — Portfolio Calculation Service:**
    *   Modularized score calculations by refactoring monolithic methods into dedicated helpers: `calculateHealth()`, `calculateDiversification()`, `calculateRisk()`, `calculateSectorExposure()`, `calculateCashAllocation()`, and `calculatePositionQuality()`.
*   **Sprint 6.4.3 — REST API Facade:**
    *   Mapped and implemented 7 REST endpoints matching standard contracts: `GET /portfolio/overview`, `GET /portfolio/health`, `GET /portfolio/xray`, `GET /portfolio/sectors`, `GET /portfolio/risk`, `GET /portfolio/history`, and `POST /portfolio/simulate`.
    *   Applied Zod validations, JWT auth isolation, memory rate-limiting, audit trailing, and performance telemetries.
*   **Root Documentation (/docs):**
    *   Created `docs/architecture.md` (data-first strategy layout).
    *   Created `docs/database.md` (schema diagrams and specs).
    *   Created `docs/api.md` (payload models and query contracts).
    *   Created `docs/security.md` (RLS policies, Zod schemas, rate limits).
    *   Created `docs/testing.md` (Vitest config and coverage).
    *   Created `docs/changelog.md` (Change tracking ledger).

#### Changed
*   Replaced deprecated Enterprise schema (`supabase_sprint9_doctor_enterprise_schema.sql`) with the correct, approved Sprint 6.4.1 schema.

#### Fixed
*   Resolved duplicate `riskIndex` symbol declaration in `portfolio-doctor.service.ts`.
