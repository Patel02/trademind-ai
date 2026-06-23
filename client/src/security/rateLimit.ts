/**
 * Client-side rate-limiting class to prevent API spamming or over-trading triggers.
 */
class RateLimiter {
  // Map to store lists of request timestamps by key/action
  private records: Record<string, number[]> = {};

  /**
   * Check if a request is allowed. Throws an error if rate limit is exceeded.
   * @param key Unique key for the action type (e.g. "orders", "resets")
   * @param limit Maximum number of requests allowed in the window
   * @param windowMs Window duration in milliseconds (e.g. 10000 for 10 seconds)
   */
  public checkLimit(key: string, limit: number = 5, windowMs: number = 10000): boolean {
    const now = Date.now();
    
    if (!this.records[key]) {
      this.records[key] = [];
    }

    // Clean up timestamps older than the window
    this.records[key] = this.records[key].filter((timestamp) => now - timestamp < windowMs);

    // Check count
    if (this.records[key].length >= limit) {
      const oldestRemaining = this.records[key][0];
      const waitTimeSec = Math.ceil((windowMs - (now - oldestRemaining)) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTimeSec} second(s) before repeating this action.`);
    }

    // Log current timestamp
    this.records[key].push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;
