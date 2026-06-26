# TradeMind AI v1.0 — Security Document

This document establishes the security guidelines, policies, and mechanisms protecting the TradeMind AI system.

---

## 1. Row-Level Security (RLS) Policies

All PostgreSQL tables inside the Supabase instance enforce Row-Level Security (RLS) to ensure absolute tenant isolation. Users can only query or write their own data.

```sql
-- Security Policy Example (portfolio_snapshots)
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY snap_select_policy ON portfolio_snapshots 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY snap_insert_policy ON portfolio_snapshots 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

For each table implemented in Sprint 6.4:
*   `portfolio_snapshots`: Isolated by `auth.uid() = user_id`.
*   `portfolio_health_scores`: Isolated by `auth.uid() = user_id`.
*   `portfolio_sector_analysis`: Isolated by `auth.uid() = user_id`.
*   `portfolio_risk_analysis`: Isolated by `auth.uid() = user_id`.
*   `portfolio_recommendations`: Isolated by `auth.uid() = user_id`.
*   `portfolio_alerts`: Isolated by `auth.uid() = user_id`.
*   `portfolio_simulations`: Isolated by `auth.uid() = user_id`.

---

## 2. API Input Schema Validation (Zod)

Every client-facing REST simulation and preference endpoint validates inputs using Zod to prevent SQL injection, malformed payloads, or overflow exploits.

### 2.1 Trade Simulation Schema
```typescript
import { z } from "zod";

export const portfolioSimulationSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  action: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});
```

### 2.2 AI User Memory Schema
```typescript
export const userMemorySchema = z.object({
  trading_style: z.string().min(1).max(100),
  preferred_sectors: z.array(z.string()),
  avg_holding_period: z.string().min(1).max(100),
  risk_appetite: z.string().min(1).max(50),
  best_performing_setup: z.string().optional(),
  most_common_mistakes: z.array(z.string())
});
```

---

## 3. Client & Server Rate Limiting

Rate limiting is enforced at the REST API Facade layer using memory sliding windows:
*   **Simulate Trade (`/portfolio/simulate`):** Max **10 requests per 10 seconds** per authenticated user ID to prevent spam.
*   **Overview/Health/Sectors/Risk Endpoints:** Max **30 requests per minute** per user ID.
*   **Get Diagnosis Endpoint:** Max **20 requests per minute** per user ID.

If the threshold is exceeded, a `RateLimitError` is thrown, halting database queries and API calculation executions.

---

## 4. Immutable Security Audit Trail

All critical REST mutations and resource reads execute a call to `auditService.logAction()` to write tracking records. These logs include:
*   `action_type`: (e.g. `GET_PORTFOLIO_HEALTH`, `SIMULATE_TRADE_IMPACT`)
*   `table_name`: Target database table
*   `user_id`: Authenticated user UUID
*   `metadata`: Parameters passed and results returned
*   `timestamp`: Current time
