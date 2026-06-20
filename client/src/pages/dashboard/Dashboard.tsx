import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { authService } from "../../services/auth.service";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  Eye
} from "lucide-react";

// Feature Imports
import MarketRadar from "../../features/market-radar/MarketRadar";
import ActivityFeed from "../../features/activity-feed/ActivityFeed";
import SignalCard from "../../features/signals/SignalCard";
import ReadinessLeaders from "../../features/signals/ReadinessLeaders";
import RegimeIndicator from "../../features/signals/RegimeIndicator";
import MorningBriefing from "../../features/signals/MorningBriefing";
import PortfolioDoctor from "../../features/signals/PortfolioDoctor";
import { signalsService } from "../../features/signals/signals.service";
import type { AIScore } from "../../features/signals/types";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [topOpportunities, setTopOpportunities] = useState<AIScore[]>([]);

  // Sync consents from localStorage if any
  useEffect(() => {
    if (user) {
      const key = `pending_consent_${user.id}`;
      const pending = localStorage.getItem(key);
      if (pending) {
        try {
          const { termsAccepted, riskAccepted } = JSON.parse(pending);
          authService.saveConsents(user.id, termsAccepted, riskAccepted).then(() => {
            localStorage.removeItem(key);
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  // Fetch signals and simulate premium content load delay
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await signalsService.getSignals();
        // Top opportunities by AI Score
        const sorted = [...data].sort((a, b) => b.score - a.score);
        setTopOpportunities(sorted.slice(0, 3));
      } catch (err) {
        console.error("Dashboard signals fetch failed", err);
      }
    };

    Promise.all([
      fetchDashboardData(),
      new Promise((resolve) => setTimeout(resolve, 800))
    ]).then(() => {
      setIsLoading(false);
    });
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        {/* Top welcome loading */}
        <Loader type="line" count={1} height="36px" style={{ marginBottom: "10px" }} />
        <Loader type="line" count={1} height="18px" style={{ marginBottom: "2rem", width: "60%" }} />

        {/* Morning Briefing Skeleton */}
        <Loader type="card" count={1} height="130px" style={{ marginBottom: "1.5rem" }} />

        {/* 2 columns row 1 skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <Loader type="card" count={2} height="180px" />
        </div>

        {/* 2 columns row 2 skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <Loader type="card" count={1} height="280px" />
          <Loader type="card" count={1} height="280px" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="dashboard-view-content"
      style={{ padding: "2rem" }}
    >
      {/* Top Banner Row */}
      <div className="welcome-banner-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "28px", fontWeight: "800" }}>
            Hey, {profile?.full_name || user?.email?.split("@")[0] || "Trader"}{" "}
            <Badge variant="success" style={{ fontSize: "11px", fontWeight: "750", padding: "2px 6px" }}>
              {profile?.subscription_plan?.toUpperCase() || "FREE"}
            </Badge>
            <Sparkles size={20} className="text-warning-icon" style={{ color: "var(--accent-yellow)" }} />
          </h1>
          <p className="dashboard-subtitle" style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px", margin: 0 }}>
            Here is your structural market overview and AI-scored equity signals.
          </p>
        </div>
        <div className="pulse-tag" style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", color: "var(--accent-green)", fontWeight: "600" }}>
          <span className="pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }}></span>
          <span className="pulse-text">Live Intelligence Feed</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Morning Briefing Panel */}
        <MorningBriefing />

        {/* ROW 1: AI Market Pulse + Market Regime Indicator */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
          {/* Widget 1: AI Market Pulse */}
          <Card 
            title="AI Market Pulse" 
            extra={<BrainCircuit size={18} style={{ color: "var(--accent-green)" }} />}
            subtitle="Real-time sentiment score"
          >
            <div className="ai-pulse-body" style={{ marginTop: "0.5rem" }}>
              <div className="ai-pulse-value" style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
                <span className="pulse-val-num" style={{ fontSize: "42px", fontWeight: "850" }}>82%</span>
                <Badge sentiment="bullish">Strong Bullish</Badge>
              </div>
              <div className="progress-bar-container" style={{ marginBottom: "10px" }}>
                <div className="progress-bar-fill" style={{ width: "82%" }}></div>
              </div>
              <p className="widget-small-text" style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                Based on 14 major indicators and news feeds.
              </p>
            </div>
          </Card>

          {/* Widget 2: Market Regime Indicator */}
          <RegimeIndicator />
        </div>

        {/* ROW 2: Market Radar Heatmap + AI Activity Feed */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
          <MarketRadar />
          <ActivityFeed />
        </div>

        {/* ROW 3: Opportunity Ranking + Sidebar Timing/Diagnostics */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
          
          {/* AI Opportunity Ranking */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "750", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Layers size={16} color="var(--accent-green)" /> AI Opportunity Ranking
              </h3>
              <Badge variant="success">Decision Support Cards</Badge>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {topOpportunities.length > 0 ? (
                topOpportunities.map((opp) => (
                  <SignalCard key={opp.symbol} aiScore={opp} />
                ))
              ) : (
                <Card style={{ padding: "2rem", textAlign: "center" }}>
                  <span style={{ color: "var(--text-secondary)" }}>No opportunities found.</span>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar: Timing Leaderboard & Portfolio Diagnostics */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Trade Readiness Leaders */}
            <ReadinessLeaders />
            
            {/* Portfolio Doctor */}
            <PortfolioDoctor />
          </div>
          
        </div>

        {/* ROW 4: Watchlist Table */}
        <Card 
          title="My Watchlist" 
          extra={<Eye size={18} style={{ color: "var(--accent-purple)" }} />}
          subtitle="Quick rates overview"
        >
          <div className="watchlist-table-preview" style={{ marginTop: "0.5rem" }}>
            <div className="watchlist-header-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginBottom: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              <span>Ticker</span>
              <span style={{ textAlign: "right" }}>Price</span>
              <span style={{ textAlign: "right" }}>Change</span>
            </div>
            <div className="watchlist-row-item" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
              <div className="ticker-info">
                <span className="ticker-symbol" style={{ fontWeight: "750", display: "block" }}>TCS</span>
                <span className="ticker-fullname" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Tata Consultancy Services</span>
              </div>
              <span className="ticker-rate" style={{ textAlign: "right", fontWeight: "600" }}>₹3,845.20</span>
              <span className="ticker-pct pos" style={{ textAlign: "right", color: "var(--accent-green)", fontWeight: "600" }}>+2.45%</span>
            </div>
            <div className="watchlist-row-item" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
              <div className="ticker-info">
                <span className="ticker-symbol" style={{ fontWeight: "750", display: "block" }}>INFY</span>
                <span className="ticker-fullname" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Infosys Ltd</span>
              </div>
              <span className="ticker-rate" style={{ textAlign: "right", fontWeight: "600" }}>₹1,490.50</span>
              <span className="ticker-pct neg" style={{ textAlign: "right", color: "var(--accent-red)", fontWeight: "600" }}>-0.82%</span>
            </div>
            <div className="watchlist-row-item" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", alignItems: "center", padding: "8px 0" }}>
              <div className="ticker-info">
                <span className="ticker-symbol" style={{ fontWeight: "750", display: "block" }}>RELIANCE</span>
                <span className="ticker-fullname" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Reliance Industries</span>
              </div>
              <span className="ticker-rate" style={{ textAlign: "right", fontWeight: "600" }}>₹2,950.40</span>
              <span className="ticker-pct pos" style={{ textAlign: "right", color: "var(--accent-green)", fontWeight: "600" }}>+1.15%</span>
            </div>
          </div>
        </Card>

      </div>
    </motion.div>
  );
};

export default Dashboard;
