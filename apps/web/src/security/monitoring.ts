export interface SystemHealthStatus {
  apiStatus: "Healthy" | "Degraded" | "Offline";
  apiLatencyMs: number;
  dbStatus: "Connected" | "Disconnected" | "Reconnecting";
  dbPingMs: number;
  aiStatus: "Online" | "Offline" | "Overloaded";
  aiLatencyMs: number;
  activeSessions: number;
  errorLogCount: number;
  errors: { timestamp: string; message: string; stack?: string }[];
}

const getLocalErrors = (): { timestamp: string; message: string; stack?: string }[] => {
  const stored = localStorage.getItem("trademind_sentry_errors");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  return [];
};

const saveLocalErrors = (errors: { timestamp: string; message: string; stack?: string }[]) => {
  localStorage.setItem("trademind_sentry_errors", JSON.stringify(errors));
};

export const sentryMock = {
  /**
   * Log exception to simulated Sentry log.
   */
  captureException(error: Error | any) {
    console.error("[SENTRY MOCK] Captured exception:", error);
    const errors = getLocalErrors();
    errors.unshift({
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack
    });
    // Limit to latest 50 errors
    saveLocalErrors(errors.slice(0, 50));
  }
};

export const monitoringService = {
  /**
   * Run diagnosis and return mock health check dashboard parameters.
   */
  getHealthStatus(): SystemHealthStatus {
    const errors = getLocalErrors();
    
    // Simulate minor variations in latency
    const apiLatency = Math.floor(35 + Math.random() * 20);
    const dbPing = Math.floor(12 + Math.random() * 10);
    const aiLatency = Math.floor(95 + Math.random() * 40);

    return {
      apiStatus: "Healthy",
      apiLatencyMs: apiLatency,
      dbStatus: "Connected",
      dbPingMs: dbPing,
      aiStatus: "Online",
      aiLatencyMs: aiLatency,
      activeSessions: 3, // Mock active developer node sessions
      errorLogCount: errors.length,
      errors
    };
  },

  /**
   * Clear error logs
   */
  clearLogs() {
    saveLocalErrors([]);
  }
};

export default sentryMock;
