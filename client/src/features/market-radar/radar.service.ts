import { supabase } from "../../services/supabase";
import type { SectorStrength } from "./types";

const mockSectorStrengths: SectorStrength[] = [
  { id: "1", sector: "IT Services", strength_score: 91, trend: "up", updated_at: new Date().toISOString() },
  { id: "2", sector: "Banking & Finance", strength_score: 88, trend: "up", updated_at: new Date().toISOString() },
  { id: "3", sector: "Automotive", strength_score: 82, trend: "flat", updated_at: new Date().toISOString() },
  { id: "4", sector: "FMCG", strength_score: 61, trend: "down", updated_at: new Date().toISOString() },
  { id: "5", sector: "Metals & Mining", strength_score: 58, trend: "down", updated_at: new Date().toISOString() }
];

export const radarService = {
  /**
   * Fetch all sector strengths.
   * If tables don't exist, resolves with mock data.
   */
  async getSectorStrengths(): Promise<SectorStrength[]> {
    try {
      const { data, error } = await supabase
        .from("sector_strength")
        .select("*")
        .order("strength_score", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        return data as SectorStrength[];
      }

      return mockSectorStrengths;
    } catch (err) {
      console.warn("Supabase sector_strength query failed; using mock data fallback.", err);
      return mockSectorStrengths;
    }
  }
};
export default radarService;
