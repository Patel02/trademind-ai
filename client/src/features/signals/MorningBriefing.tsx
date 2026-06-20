import React, { useState, useEffect } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { 
  Sparkles, 
  TrendingUp, 
  Flame, 
  AlertTriangle,
  Compass
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import { signalsService } from "./signals.service";
import type { MarketRegime, AIScore } from "./types";

export const MorningBriefing: React.FC = () => {
  const { user, profile } = useAuth();
  const [regime, setRegime] = useState<MarketRegime | null>(null);
  const [topOpp, setTopOpp] = useState<AIScore | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Rakesh";

  useEffect(() => {
    Promise.all([
      signalsService.getMarketRegime(),
      signalsService.getSignals()
    ]).then(([regimeData, signalsData]) => {
      setRegime(regimeData);
      if (signalsData.length > 0) {
        // Find top opportunity
        const sorted = [...signalsData].sort((a, b) => b.score - a.score);
        setTopOpp(sorted[0]);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="morning-briefing-loading" style={{ height: "130px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Preparing your morning brief...</span>
      </div>
    );
  }

  const getGreetingTime = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div 
      className="morning-briefing-banner"
      style={{
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(16, 185, 129, 0.0) 100%)",
        border: "1px solid rgba(37, 99, 235, 0.15)",
        borderRadius: "14px",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.25)"
      }}
    >
      {/* Background glow effects */}
      <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "160px", height: "160px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "20%", bottom: "-60px", width: "120px", height: "120px", background: "rgba(37, 99, 235, 0.06)", borderRadius: "50%", filter: "blur(30px)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
        
        {/* Left Side: Welcomer */}
        <div style={{ flex: "1 1 350px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "22px", fontWeight: "800", color: "#fff" }}>
            {getGreetingTime()}, {displayName}! <Sparkles size={18} color="var(--accent-yellow)" className="breaking-icon" />
          </h2>
          <p style={{ margin: "6px 0 0 0", fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Here is your automated intelligence digest. Market structures remain favorable with high sector support indices active today.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "1rem", flexWrap: "wrap" }}>
            <Badge sentiment="bullish" style={{ fontWeight: "700" }}>
              Nifty Regime: {regime?.regime || "Bull Market"} ({regime?.confidence || 81}%)
            </Badge>
            <Badge variant="warning" style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <AlertTriangle size={12} /> Risk Index: Moderate
            </Badge>
          </div>
        </div>

        {/* Right Side: Quick Highlights Grid */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: "1rem", 
            flex: "2 1 450px"
          }}
          className="briefing-highlights-grid"
        >
          {/* Strong Sectors */}
          <div style={{ background: "rgba(255, 255, 255, 0.015)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              <Flame size={12} color="var(--accent-red)" /> Strongest Sectors
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: "600", color: "#fff" }}>IT Services</span>
                <strong style={{ color: "var(--accent-green)" }}>91</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: "600", color: "#fff" }}>Banking</span>
                <strong style={{ color: "var(--accent-green)" }}>88</strong>
              </div>
            </div>
          </div>

          {/* Watchlist Revisions */}
          <div style={{ background: "rgba(255, 255, 255, 0.015)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              <TrendingUp size={12} color="var(--accent-green)" /> Timing Revisions
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: "600", color: "#fff" }}>TCS</span>
                <strong style={{ color: "var(--accent-green)" }}>+8 pts</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: "600", color: "#fff" }}>RELIANCE</span>
                <strong style={{ color: "var(--accent-green)" }}>+5 pts</strong>
              </div>
            </div>
          </div>

          {/* Top Opportunity */}
          {topOpp && (
            <div style={{ background: "rgba(37, 99, 235, 0.03)", border: "1px solid rgba(37, 99, 235, 0.2)", borderRadius: "10px", padding: "12px", position: "relative" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", color: "var(--accent-blue)", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
                <Compass size={12} /> Top Opportunity
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>{topOpp.symbol}</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>AI Score: {topOpp.score}</span>
                </div>
                <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-green)", fontSize: "11px", fontWeight: "750", borderRadius: "5px", padding: "2px 6px" }}>
                  {topOpp.opportunity_status}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default MorningBriefing;
