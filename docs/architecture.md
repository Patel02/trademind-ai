# TradeMind AI v1.0 — Architecture Document

This document defines the core architecture design system of the TradeMind AI platform, establishing the modular data-first pipelines that power the system.

---

## 1. Architectural Strategy: Data-First Pipeline

TradeMind AI places **Data** at the center of the system rather than the AI models themselves. This prevents vendor lock-in, ensures high performance, and isolates analytical computations from LLM variability.

```mermaid
graph TD
    A[Live Market Data] --> B[Data Validation]
    B --> C[Database Store]
    C --> D[Analytics Engine]
    D --> E[AI Intelligence Layer]
    E --> F[User Interface]
    
    style A fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style B fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    style C fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#fff
    style D fill:#1e293b,stroke:#eab308,stroke-width:2px,color:#fff
    style E fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff
    style F fill:#1e293b,stroke:#f43f5e,stroke-width:2px,color:#fff
```

### 1.1 Layers Description

1. **Live Market Data:** Direct feed of prices, tickers, volumes, and news feeds.
2. **Data Validation:** Zod and SQL constraints validate schemas, price bounds, and input formats before processing.
3. **Database Store:** Supabase/PostgreSQL instance containing snapshots, scores, history ledger, and paper trading state.
4. **Analytics Engine:** Core mathematical service calculating diversification, risk, sector exposure, cash allocation, and position quality metrics entirely on the backend.
5. **AI Intelligence Layer:** Explains analytics data, suggests rebalancing models, and produces human-digestible alerts without computing scores directly.
6. **User Interface:** High-aesthetic dashboard presenting gauges, X-Rays, allocation bars, rebalancing simulators, and alerts.

---

## 2. Calculation Flow (Portfolio Doctor Pro)

When diagnosing a portfolio, the analytics engine computes metrics in the following sequence:

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant Facade as API REST Facade
    participant Calc as Portfolio calculation service
    participant DB as Supabase DB
    
    UI->>Facade: request overview/health (goal)
    Facade->>DB: fetch portfolio & active positions
    DB-->>Facade: returns balance & holdings rows
    Facade->>Calc: diagnosePortfolio(portfolio, positions, goal)
    
    Note over Calc: calculateDiversification()
    Note over Calc: calculateRisk()
    Note over Calc: calculateSectorExposure()
    Note over Calc: calculateCashAllocation()
    Note over Calc: calculatePositionQuality()
    Note over Calc: calculateHealth()
    
    Calc-->>Facade: returns unified PortfolioDiagnosis
    Facade->>DB: persist health snapshot/simulations (if authenticated)
    Facade-->>UI: returns JSON payload
```

---

## 3. Tech Stack Standard

*   **Frontend core:** React 18, TypeScript, Tailwind CSS / Vanilla CSS Variables
*   **State & Query:** React Query, Supabase client
*   **Backend Serverless Facade:** TypeScript API facades utilizing JWT tokens and RLS
*   **Testing suite:** Vitest
*   **Database engine:** PostgreSQL (Supabase) with RLS policies, composite indexes, and audit logs
