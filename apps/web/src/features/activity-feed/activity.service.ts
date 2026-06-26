import { supabase } from "../../services/supabase";
import type { ActivityFeedItem } from "./types";

const mockActivities: ActivityFeedItem[] = [
  {
    id: "1",
    type: "Signal",
    message: "AI Confidence rating for TCS increased from 81 → 89 based on volume breakout.",
    metadata: { symbol: "TCS", old_score: 81, new_score: 89 },
    created_at: new Date(Date.now() - 10 * 60000).toISOString() // 10 mins ago
  },
  {
    id: "2",
    type: "Sector",
    message: "IT Services sector upgraded to Strong Bullish following cloud deal confirmations.",
    metadata: { sector: "IT Services", status: "Strong Bullish" },
    created_at: new Date(Date.now() - 35 * 60000).toISOString() // 35 mins ago
  },
  {
    id: "3",
    type: "News",
    message: "RBI Repo rate decision uploaded. Financial sector volatility adjustment: Low.",
    metadata: { category: "Economy", impact: "Neutral" },
    created_at: new Date(Date.now() - 72 * 60000).toISOString() // 1.2 hours ago
  },
  {
    id: "4",
    type: "Signal",
    message: "Reliance Industries Impact Score upgraded to 92 after retail buyout announcement.",
    metadata: { symbol: "RELIANCE", score: 92 },
    created_at: new Date(Date.now() - 120 * 60000).toISOString() // 2 hours ago
  },
  {
    id: "5",
    type: "Regime",
    message: "NIFTY Index regime adjusted to Bullish as Nasdaq prints cooler CPI reports.",
    metadata: { index: "NIFTY 50", regime: "Bullish" },
    created_at: new Date(Date.now() - 300 * 60000).toISOString() // 5 hours ago
  }
];

export const activityService = {
  /**
   * Fetch all activity feed items.
   * If tables don't exist, resolves with mock data.
   */
  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from("ai_activity_feed")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        return data as ActivityFeedItem[];
      }

      return mockActivities;
    } catch (err) {
      console.warn("Supabase ai_activity_feed query failed; using mock data fallback.", err);
      return mockActivities;
    }
  }
};
export default activityService;
