import React, { useState, useEffect } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  RefreshCw
} from "lucide-react";
import RegimeIndicator from "../../features/signals/RegimeIndicator";
import ReadinessLeaders from "../../features/signals/ReadinessLeaders";
import SignalCard from "../../features/signals/SignalCard";
import { signalsService } from "../../features/signals/signals.service";
import type { AIScore } from "../../features/signals/types";
import Loader from "../../components/ui/Loader";
import Card from "../../components/ui/Card";

export const Signals: React.FC = () => {
  const [signals, setSignals] = useState<AIScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrend, setSelectedTrend] = useState<string>("All");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>("All");
  const [activeSymbol, setActiveSymbol] = useState<string>("TCS");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSignals = async () => {
    try {
      const data = await signalsService.getSignals();
      setSignals(data);
      if (data.length > 0 && !activeSymbol) {
        // Set first ticker as active by default
        setActiveSymbol(data[0].symbol);
      }
    } catch (error) {
      console.error("Failed to load signals in page", error);
    }
  };

  useEffect(() => {
    fetchSignals().finally(() => {
      setLoading(false);
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSignals();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSelectSymbol = (symbol: string) => {
    setActiveSymbol(symbol);
    // Find the element and scroll into view smoothly
    const element = document.getElementById(`signal-card-${symbol}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Filter signals based on search query, trend, risk, and opportunity filters
  const filteredSignals = signals.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrend = selectedTrend === "All" || item.trend === selectedTrend;
    const matchesRisk = selectedRisk === "All" || item.risk === selectedRisk;
    const matchesOpportunity = selectedOpportunity === "All" || 
      (selectedOpportunity === "Elite" && item.opportunity_status === "Elite Opportunity") ||
      (selectedOpportunity === "Strong" && item.opportunity_status === "Strong Opportunity") ||
      (selectedOpportunity === "Watch" && item.opportunity_status === "Watch Closely") ||
      (selectedOpportunity === "Avoid" && item.opportunity_status === "Avoid");
    return matchesSearch && matchesTrend && matchesRisk && matchesOpportunity;
  });

  return (

    <div style={{ position: "relative" }} className="signals-page-wrapper">
      
      {/* Page Header */}
      <div className="signals-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            AI Signal Engine
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", margin: 0 }}>
            Opportunity Intelligence & Explainable Scoring Model
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          className="refresh-signals-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(128,128,128,0.06)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? "spin-animation" : ""} />
          {isRefreshing ? "Calculating..." : "Recalculate Signals"}
        </button>
      </div>

      <div style={{ padding: "2rem" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <Loader type="card" count={1} height="200px" />
              <Loader type="card" count={1} height="250px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <Loader type="card" count={3} height="80px" />
            </div>
          </div>
        ) : (
          <div className="signals-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "2rem" }}>
            
            {/* LEFT COLUMN: Regime Indicator & Readiness Leaderboard */}
            <div className="signals-left-column" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Market Regime */}
              <RegimeIndicator />

              {/* Leaderboard List */}
              <ReadinessLeaders 
                activeSymbol={activeSymbol} 
                onSelectSymbol={handleSelectSymbol} 
              />
              
            </div>

            {/* RIGHT COLUMN: Filter bar and Signals cards grid */}
            <div className="signals-right-column" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Search & Filters */}
              <div 
                className="signals-filters-bar"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }} className="responsive-split-row">
                  {/* Search Input */}
                  <div style={{ position: "relative", flexGrow: 1 }}>
                    <Search 
                      size={16} 
                      color="var(--text-secondary)" 
                      style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} 
                    />
                    <input
                      type="text"
                      placeholder="Search tickers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "10px 12px 10px 36px",
                        color: "var(--text-primary)",
                        fontSize: "13.5px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  
                  {/* Filter Label */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: "600", flexShrink: 0 }}>
                    <SlidersHorizontal size={14} /> Filter Signal Matrix
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  {/* Trend Filter Badges */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Trend:</span>
                    {["All", "Bullish", "Bearish", "Neutral"].map((trend) => (
                      <button
                        key={trend}
                        onClick={() => setSelectedTrend(trend)}
                        style={{
                          background: selectedTrend === trend ? "rgba(16, 185, 129, 0.08)" : "transparent",
                          color: selectedTrend === trend ? "var(--accent-green)" : "var(--text-secondary)",
                          border: selectedTrend === trend ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {trend}
                      </button>
                    ))}
                  </div>

                  {/* Opportunity Filter Badges */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Opportunity:</span>
                    {["All", "Elite", "Strong", "Watch", "Avoid"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedOpportunity(opt)}
                        style={{
                          background: selectedOpportunity === opt ? "rgba(245, 158, 11, 0.08)" : "transparent",
                          color: selectedOpportunity === opt ? "var(--accent-yellow)" : "var(--text-secondary)",
                          border: selectedOpportunity === opt ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Risk Filter Badges */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Risk:</span>
                    {["All", "Low", "Medium", "High"].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setSelectedRisk(risk)}
                        style={{
                          background: selectedRisk === risk ? "rgba(37, 99, 235, 0.08)" : "transparent",
                          color: selectedRisk === risk ? "var(--accent-blue)" : "var(--text-secondary)",
                          border: selectedRisk === risk ? "1px solid rgba(37, 99, 235, 0.3)" : "1px solid transparent",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Signals Cards Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredSignals.length > 0 ? (
                  filteredSignals.map((item) => (
                    <div 
                      key={item.symbol} 
                      id={`signal-card-${item.symbol}`}
                      style={{ transition: "all 0.3s" }}
                    >
                      <SignalCard 
                        key={item.symbol + (item.symbol === activeSymbol ? "-expanded" : "")}
                        aiScore={item} 
                        isInitiallyExpanded={item.symbol === activeSymbol}
                      />
                    </div>
                  ))
                ) : (
                  <Card style={{ padding: "3rem", textAlign: "center" }}>
                    <span style={{ color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                      No equity signals found matching your current filters.
                    </span>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedTrend("All"); setSelectedRisk("All"); setSelectedOpportunity("All"); }}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Clear Filters
                    </button>
                  </Card>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default Signals;
