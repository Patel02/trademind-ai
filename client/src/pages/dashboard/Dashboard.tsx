import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { authService } from "../../services/auth.service";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/ui/Loader";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  BrainCircuit, 
  Activity, 
  Sparkles, 
  Layers, 
  Newspaper, 
  Eye
} from "lucide-react";

// Feature Imports
import MarketRadar from "../../features/market-radar/MarketRadar";
import ActivityFeed from "../../features/activity-feed/ActivityFeed";
import NewsCard from "../../features/news/NewsCard";
import { newsService } from "../../features/news/news.service";
import type { NewsItem } from "../../features/news/types";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);

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

  // Fetch news and simulate premium content load delay
  useEffect(() => {
    Promise.all([
      newsService.getNews().then((data) => setLatestNews(data.slice(0, 2))),
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

        {/* 2 columns row 1 skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <Loader type="card" count={2} height="180px" />
        </div>

        {/* 2 columns row 2 skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <Loader type="card" count={1} height="280px" />
          <Loader type="card" count={1} height="280px" />
        </div>

        {/* 2 columns row 3 skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
          <Loader type="card" count={1} height="220px" />
          <Loader type="card" count={1} height="220px" />
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
      <div className="welcome-banner-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "28px", fontWeight: "800" }}>
            Hey, {profile?.full_name || user?.email?.split("@")[0]}{" "}
            <Badge variant="success" style={{ fontSize: "11px", fontWeight: "750", padding: "2px 6px" }}>
              {profile?.subscription_plan?.toUpperCase() || "FREE"}
            </Badge>
            <Sparkles size={20} className="text-warning-icon" style={{ color: "var(--accent-yellow)" }} />
          </h1>
          <p className="dashboard-subtitle" style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px", margin: 0 }}>
            Here is your market summary and trading signals for today.
          </p>
        </div>
        <div className="pulse-tag" style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", color: "var(--accent-green)", fontWeight: "600" }}>
          <span className="pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", display: "inline-block" }}></span>
          <span className="pulse-text">Live Intelligence Feed</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* ROW 1: AI Market Pulse + Market Overview (Indices) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }} className="responsive-split-row">
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

          {/* Widget 2: Market Overview (Indices) */}
          <Card title="Market Indices" extra={<Activity size={18} style={{ color: "var(--accent-blue)" }} />}>
            <div className="indices-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="index-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="index-name" style={{ fontSize: "13.5px", fontWeight: "600" }}>NIFTY 50</span>
                <div className="index-price-group" style={{ textAlign: "right" }}>
                  <span className="index-price" style={{ fontWeight: "700", display: "block" }}>23,465.60</span>
                  <span className="index-change pos" style={{ color: "var(--accent-green)", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>
                    <TrendingUp size={11} /> +1.24%
                  </span>
                </div>
              </div>
              <div className="index-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="index-name" style={{ fontSize: "13.5px", fontWeight: "600" }}>BANK NIFTY</span>
                <div className="index-price-group" style={{ textAlign: "right" }}>
                  <span className="index-price" style={{ fontWeight: "700", display: "block" }}>49,852.10</span>
                  <span className="index-change pos" style={{ color: "var(--accent-green)", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>
                    <TrendingUp size={11} /> +0.94%
                  </span>
                </div>
              </div>
              <div className="index-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="index-name" style={{ fontSize: "13.5px", fontWeight: "600" }}>SENSEX</span>
                <div className="index-price-group" style={{ textAlign: "right" }}>
                  <span className="index-price" style={{ fontWeight: "700", display: "block" }}>77,150.30</span>
                  <span className="index-change neg" style={{ color: "var(--accent-red)", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>
                    <TrendingDown size={11} /> -0.12%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ROW 2: Market Radar Heatmap + AI Activity Feed */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.5rem" }} className="responsive-split-row">
          <MarketRadar />
          <ActivityFeed />
        </div>

        {/* ROW 3: Top Opportunities + Latest AI Summarized News */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.5rem" }} className="responsive-split-row">
          {/* Widget: Top Opportunities */}
          <Card title="Top Opportunities" extra={<Layers size={18} style={{ color: "var(--accent-yellow)" }} />}>
            <div className="indices-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "0.5rem" }}>
              <div className="opportunity-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px" }}>
                <span className="opportunity-ticker" style={{ fontWeight: "750" }}>TCS</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="opportunity-price" style={{ fontSize: "13.5px", fontWeight: "600" }}>₹3,845.20</span>
                  <Badge variant="success">BUY (89)</Badge>
                </div>
              </div>
              <div className="opportunity-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px" }}>
                <span className="opportunity-ticker" style={{ fontWeight: "750" }}>RELIANCE</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="opportunity-price" style={{ fontSize: "13.5px", fontWeight: "600" }}>₹2,950.40</span>
                  <Badge variant="success">BUY (87)</Badge>
                </div>
              </div>
              <div className="opportunity-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px" }}>
                <span className="opportunity-ticker" style={{ fontWeight: "750" }}>HDFCBANK</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="opportunity-price" style={{ fontSize: "13.5px", fontWeight: "600" }}>₹1,560.10</span>
                  <Badge variant="warning">HOLD (75)</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Widget: Latest AI Summarized News */}
          <Card 
            title="Latest Intelligence News" 
            subtitle="Recent impact items"
            extra={<Newspaper size={18} style={{ color: "var(--text-secondary)" }} />}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {latestNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </Card>
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
