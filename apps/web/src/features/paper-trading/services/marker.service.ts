import { supabase } from "../../../services/supabase";
import { auditService } from "../../../security/audit.service";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChartMarker {
  id: string;
  user_id: string;
  symbol: string;
  trade_id?: string | null;
  marker_type: "BUY" | "SELL";
  price: number;
  quantity: number;
  notes?: string;
  created_at: string;
}

// ─── Local Storage Helpers ────────────────────────────────────────────────────
const LS_KEY = "trademind_chart_markers_v1";

const getLocalMarkers = (): ChartMarker[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMarkers = (markers: ChartMarker[]) => {
  localStorage.setItem(LS_KEY, JSON.stringify(markers));
};

// ─── User Helper ──────────────────────────────────────────────────────────────
const getUserId = async (): Promise<string> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    /* silent */
  }
  return "00000000-0000-0000-0000-000000000000";
};

// ─── Service ──────────────────────────────────────────────────────────────────
export const markerService = {
  /**
   * Save a BUY or SELL marker.
   * Writes to Supabase (authenticated users) AND localStorage (always).
   */
  async saveMarker(
    symbol: string,
    type: "BUY" | "SELL",
    price: number,
    quantity: number,
    tradeId?: string | null,
    notes?: string
  ): Promise<ChartMarker> {
    const userId = await getUserId();
    const now = new Date().toISOString();

    const marker: ChartMarker = {
      id: `mkr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      symbol: symbol.toUpperCase(),
      trade_id: tradeId ?? null,
      marker_type: type,
      price,
      quantity,
      notes: notes ?? "",
      created_at: now,
    };

    // Try Supabase
    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const { data, error } = await supabase
          .from("chart_markers")
          .insert({
            user_id: userId,
            symbol: marker.symbol,
            trade_id: marker.trade_id,
            marker_type: marker.marker_type,
            price: marker.price,
            quantity: marker.quantity,
            notes: marker.notes,
          })
          .select()
          .single();

        if (!error && data) {
          marker.id = data.id; // use DB uuid
        }
      } catch (err) {
        console.warn("[markerService] Supabase insert failed; using local marker.", err);
      }
    }

    // Always persist to localStorage
    const local = getLocalMarkers();
    local.unshift(marker);
    saveLocalMarkers(local);

    // E2: Log audit event CHART_MARKER_CREATED
    try {
      await auditService.logAction("CHART_MARKER_CREATED", "chart_markers", marker.id, {
        symbol: marker.symbol,
        marker_type: marker.marker_type,
        price: marker.price,
        quantity: marker.quantity
      });
    } catch (auditErr) {
      console.warn("[markerService] Audit logging failed for marker creation.", auditErr);
    }

    return marker;
  },

  /**
   * Load all markers for a given symbol (for the current user).
   * Reads Supabase first; falls back to localStorage.
   */
  async getMarkersForSymbol(symbol: string): Promise<ChartMarker[]> {
    const userId = await getUserId();
    const upperSymbol = symbol.toUpperCase();

    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const { data, error } = await supabase
          .from("chart_markers")
          .select("*")
          .eq("user_id", userId)
          .eq("symbol", upperSymbol)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          const dbMarkers: ChartMarker[] = data.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            symbol: r.symbol,
            trade_id: r.trade_id,
            marker_type: r.marker_type as "BUY" | "SELL",
            price: Number(r.price),
            quantity: Number(r.quantity),
            notes: r.notes ?? "",
            created_at: r.created_at,
          }));

          // Sync to localStorage for offline fallback
          const local = getLocalMarkers().filter(
            (m) => m.user_id !== userId || m.symbol !== upperSymbol
          );
          saveLocalMarkers([...local, ...dbMarkers]);

          return dbMarkers;
        }
      } catch (err) {
        console.warn("[markerService] Supabase fetch failed; using local markers.", err);
      }
    }

    // Fallback: localStorage
    return getLocalMarkers().filter(
      (m) => m.user_id === userId && m.symbol === upperSymbol
    );
  },

  /**
   * Get all markers for a user (all symbols) — used by Portfolio/History.
   */
  async getAllMarkers(): Promise<ChartMarker[]> {
    const userId = await getUserId();

    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        const { data, error } = await supabase
          .from("chart_markers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            symbol: r.symbol,
            trade_id: r.trade_id,
            marker_type: r.marker_type as "BUY" | "SELL",
            price: Number(r.price),
            quantity: Number(r.quantity),
            notes: r.notes ?? "",
            created_at: r.created_at,
          }));
        }
      } catch (err) {
        console.warn("[markerService] getAllMarkers Supabase fetch failed.", err);
      }
    }

    return getLocalMarkers().filter((m) => m.user_id === userId);
  },

  /**
   * Delete all markers for a symbol (used on portfolio reset).
   */
  async deleteMarkersForUser(): Promise<void> {
    const userId = await getUserId();

    if (userId !== "00000000-0000-0000-0000-000000000000") {
      try {
        await supabase.from("chart_markers").delete().eq("user_id", userId);
      } catch (err) {
        console.warn("[markerService] Supabase delete failed.", err);
      }
    }

    const remaining = getLocalMarkers().filter((m) => m.user_id !== userId);
    saveLocalMarkers(remaining);
  },

  /**
   * Emit custom DOM event so TradingChart can reload markers reactively.
   */
  emitMarkersUpdated(symbol: string) {
    window.dispatchEvent(
      new CustomEvent("trademind:markers-updated", { detail: { symbol: symbol.toUpperCase() } })
    );
  },
};

export default markerService;
