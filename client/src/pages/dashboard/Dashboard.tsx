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
  Eye, 
  Check 
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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

  // Simulate premium content load delay
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
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
        <Loader type="line" count={1} height="36px" className="mb-2" />
        <Loader type="line" count={1} height="18px" className="mb-8" style={{ width: "60%" }} />

        {/* 4 columns layout skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <Loader type="card" count={1} />
          <Loader type="card" count={1} />
          <Loader type="card" count={1} />
          <Loader type="card" count={1} />
        </div>

        {/* 2 columns layout skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem" }}>
          <Loader type="card" count={1} height="320px" />
          <Loader type="card" count={1} height="320px" />
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
      <div className="welcome-banner-row">
        <div>
          <h1 className="dashboard-title">
            Hey, {profile?.full_name || user?.email?.split("@")[0]} <Sparkles size={20} className="text-warning-icon" />
          </h1>
          <p className="dashboard-subtitle">Here is your market summary and trading signals for today.</p>
        </div>
        <div className="pulse-tag">
          <span className="pulse-dot"></span>
          <span className="pulse-text">Live market feed</span>
        </div>
      </div>

      {/* Primary Metrics Row (Grid 4 column layout) */}
      <div className="metrics-grid">
        {/* Widget 1: AI Market Pulse */}
        <Card 
          title="AI Market Pulse" 
          extra={<BrainCircuit size={18} color="#10b981" />}
          subtitle="Real-time sentiment score"
        >
          <div className="ai-pulse-body">
            <div className="ai-pulse-value">
              <span className="pulse-val-num">82%</span>
              <Badge sentiment="bullish">Strong Bullish</Badge>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: "82%" }}></div>
            </div>
            <p className="widget-small-text">Based on 14 major indicators and news feeds.</p>
          </div>
        </Card>

        {/* Widget 2: Market Overview (Indices) */}
        <Card title="Market Indices" extra={<Activity size={18} color="#3b82f6" />}>
          <div className="indices-list">
            <div className="index-row">
              <span className="index-name">NIFTY 50</span>
              <div className="index-price-group">
                <span className="index-price">23,465.60</span>
                <span className="index-change pos">
                  <TrendingUp size={12} /> +1.24%
                </span>
              </div>
            </div>
            <div className="index-row">
              <span className="index-name">BANK NIFTY</span>
              <div className="index-price-group">
                <span className="index-price">49,852.10</span>
                <span className="index-change pos">
                  <TrendingUp size={12} /> +0.94%
                </span>
              </div>
            </div>
            <div className="index-row">
              <span className="index-name">SENSEX</span>
              <div className="index-price-group">
                <span className="index-price">77,150.30</span>
                <span className="index-change neg">
                  <TrendingDown size={12} /> -0.12%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Widget 3: Top Opportunities */}
        <Card title="Top Opportunities" extra={<Layers size={18} color="#f59e0b" />}>
          <div className="indices-list">
            <div className="opportunity-row">
              <span className="opportunity-ticker">TCS</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="opportunity-price">₹3,845.20</span>
                <Badge variant="success">BUY</Badge>
              </div>
            </div>
            <div className="opportunity-row">
              <span className="opportunity-ticker">RELIANCE</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="opportunity-price">₹2,950.40</span>
                <Badge variant="success">STRONG BUY</Badge>
              </div>
            </div>
            <div className="opportunity-row">
              <span className="opportunity-ticker">HDFCBANK</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="opportunity-price">₹1,560.10</span>
                <Badge variant="warning">HOLD</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Plan summary */}
        <Card title="Account Info" extra={<Sparkles size={18} color="#aa3bff" />}>
          <div className="account-info-widget">
            <div className="plan-badge-container">
              <span className="plan-label">ACTIVE PLAN</span>
              <span className="plan-title">{profile?.subscription_plan?.toUpperCase() || "FREE PLAN"}</span>
            </div>
            <div className="account-meta">
              <div className="meta-row">
                <span>Account Role</span>
                <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{profile?.role || "User"}</span>
              </div>
              <div className="meta-row">
                <span>Consents Sync</span>
                <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Check size={14} /> Synchronized
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Row (Grid 2 column layout) */}
      <div className="secondary-grid">
        {/* Widget 4: News Preview */}
        <Card 
          title="Market News Summary" 
          extra={<Newspaper size={18} color="#64748b" />}
          subtitle="Top financial events today"
        >
          <div className="news-summary-list">
            <div className="news-item">
              <span className="news-time">10 mins ago</span>
              <h4 className="news-item-title">RBI holds repo rate unchanged at 6.5%, maintains 'withdrawal of accommodation' stance.</h4>
            </div>
            <div className="news-item">
              <span className="news-time">45 mins ago</span>
              <h4 className="news-item-title">US tech indices rally as federal inflation metrics print cooler than expected figures.</h4>
            </div>
            <div className="news-item">
              <span className="news-time">2 hours ago</span>
              <h4 className="news-item-title">TCS announces major cloud partnership with European retail giant, stock jumps 2.3%.</h4>
            </div>
            <div className="news-item">
              <span className="news-time">4 hours ago</span>
              <h4 className="news-item-title">Gold rates approach record highs amidst geopolitical uncertainty and dollar consolidation.</h4>
            </div>
            <div className="news-item">
              <span className="news-time">6 hours ago</span>
              <h4 className="news-item-title">Crude oil steady at $82/bbl following OPEC production cuts renewal guidelines.</h4>
            </div>
          </div>
        </Card>

        {/* Widget 5: Watchlist Preview */}
        <Card 
          title="My Watchlist" 
          extra={<Eye size={18} color="#aa3bff" />}
          subtitle="Quick rates overview"
        >
          <div className="watchlist-table-preview">
            <div className="watchlist-header-row">
              <span>TICKER</span>
              <span style={{ textAlign: "right" }}>PRICE</span>
              <span style={{ textAlign: "right" }}>CHANGE</span>
            </div>
            <div className="watchlist-row-item">
              <div className="ticker-info">
                <span className="ticker-symbol">TCS</span>
                <span className="ticker-fullname">Tata Consult...</span>
              </div>
              <span className="ticker-rate">₹3,845.20</span>
              <span className="ticker-pct pos">+2.45%</span>
            </div>
            <div className="watchlist-row-item">
              <div className="ticker-info">
                <span className="ticker-symbol">INFY</span>
                <span className="ticker-fullname">Infosys Ltd</span>
              </div>
              <span className="ticker-rate">₹1,490.50</span>
              <span className="ticker-pct neg">-0.82%</span>
            </div>
            <div className="watchlist-row-item">
              <div className="ticker-info">
                <span className="ticker-symbol">RELIANCE</span>
                <span className="ticker-fullname">Reliance Ind.</span>
              </div>
              <span className="ticker-rate">₹2,950.40</span>
              <span className="ticker-pct pos">+1.15%</span>
            </div>
            <div className="watchlist-row-item">
              <div className="ticker-info">
                <span className="ticker-symbol">HDFCBANK</span>
                <span className="ticker-fullname">HDFC Bank Ltd</span>
              </div>
              <span className="ticker-rate">₹1,560.10</span>
              <span className="ticker-pct pos">+0.04%</span>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default Dashboard;
