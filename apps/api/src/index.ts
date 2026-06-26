import * as express from "express";
import { Request, Response, NextFunction } from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import { formatDateTime } from "@trademind/utils";

dotenv.config();

const app = express.default();
const PORT = process.env.PORT || 5000;

app.use(cors.default());
app.use(express.json());

/**
 * 1. Enterprise Request Logging Middleware
 * Tracks: User ID, Endpoint, Execution Time, Status Code, IP, and Device
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const requestTime = formatDateTime(new Date().toISOString());

  // Capture original send/end to log details on request completion
  const originalSend = res.send;
  res.send = function (_body) {
    const duration = (performance.now() - startTime).toFixed(2);
    const userId = req.headers["x-user-id"] || "anonymous";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const device = req.headers["user-agent"] || "unknown";

    console.log(
      `[${requestTime}] USER=${userId} METHOD=${req.method} URL=${req.originalUrl} STATUS=${res.statusCode} IP=${ip} DURATION=${duration}ms DEVICE=${device}`
    );

    return originalSend.apply(this, arguments as any);
  };

  next();
});

/**
 * 2. Scaffolding Backend Endpoints
 */

// GET /portfolio/overview
app.get("/portfolio/overview", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      nav: 1056700.50,
      holdingsValue: 656700.50,
      holdingsCost: 600000.00,
      unrealizedPnL: 56700.50,
      unrealizedPnLPct: 9.45,
      cashPct: 37.8
    }
  });
});

// GET /portfolio/health
app.get("/portfolio/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      healthScore: 87,
      diversificationScore: 91,
      riskHealthScore: 82,
      sectorBalanceScore: 85,
      cashAllocationScore: 89,
      positionQualityScore: 88,
      grade: "A",
      stabilityScore: 84,
      growthPotentialScore: 76,
      healthTrend: "up"
    }
  });
});

// POST /portfolio/simulate
app.post("/portfolio/simulate", (req: Request, res: Response) => {
  const { symbol, action, quantity, price } = req.body;

  if (!symbol || !action || !quantity || !price) {
    return res.status(400).json({
      success: false,
      message: "Missing required simulation fields.",
      errorCode: "SIMULATION_VALIDATION_FAILED"
    });
  }

  res.json({
    success: true,
    data: {
      current: {
        healthScore: 87,
        cashPct: 15.2,
        concentrationPct: 32.0,
        itExposurePct: 42.0
      },
      simulated: {
        healthScore: 84,
        cashPct: 11.1,
        concentrationPct: 46.0,
        itExposurePct: 46.0
      },
      warnings: [
        "Concentration Risk: Stock size will exceed limit.",
        "Cash Buffer: Cash falls near warning boundaries."
      ]
    }
  });
});

/**
 * 3. Standard Error Handling Middleware
 * Ensures no raw errors are sent to the client.
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandle Error Caught:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected database or server error occurred.",
    errorCode: err.code || "INTERNAL_SERVER_ERROR"
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[API Server] Running on port ${PORT}`);
});
