import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  BookOpen,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  BarChart2,
} from "lucide-react";
import { paperTradingService, type PaperClosedTrade } from "../../features/paper-trading/paper-trading.service";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

type FilterTab = "all" | "open" | "closed" | "wins" | "losses";

const TAB_CONFIG: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all",    label: "All Trades",  icon: <BarChart2 size={13} /> },
  { key: "open",   label: "Open",        icon: <Clock size={13} /> },
  { key: "closed", label: "Closed",      icon: <CheckCircle2 size={13} /> },
  { key: "wins",   label: "Wins",        icon: <TrendingUp size={13} /> },
  { key: "losses", label: "Losses",      icon: <TrendingDown size={13} /> },
];

export const History: React.FC = () => {
  const [trades, setTrades] = useState<PaperClosedTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const history = await paperTradingService.getClosedTrades();
      setTrades(history);
    } catch (err) {
      console.error("Error loading closed trades:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for new trades (DOM event from paper-trading service)
  useEffect(() => {
    const onTradeUpdate = () => { loadData(); };
    window.addEventListener("trademind:markers-updated", onTradeUpdate);
    return () => window.removeEventListener("trademind:markers-updated", onTradeUpdate);
  }, [loadData]);

  const toggleExpand = (id: string) => {
    setExpandedTradeId((prev) => (prev === id ? null : id));
  };

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filteredTrades = trades.filter((t) => {
    if (activeTab === "open")   return (t as any).status === "open";
    if (activeTab === "closed") return (t as any).status !== "open";
    if (activeTab === "wins")   return t.profit_loss >= 0;
    if (activeTab === "losses") return t.profit_loss < 0;
    return true;
  });

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalTrades = trades.length;
  const wins        = trades.filter((t) => t.profit_loss >= 0).length;
  const losses      = trades.filter((t) => t.profit_loss < 0).length;
  const totalPnL    = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  const winRate     = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-primary)" }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Trade History Ledger
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            All paper trades — persistent across sessions, devices, and logins
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            fontFamily: "inherit",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Summary Stats Row ─────────────────────────────────────────────── */}
      {!loading && totalTrades > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Total Trades", value: totalTrades, icon: <BarChart2 size={16} />, color: "var(--accent-purple)" },
            { label: "Win Rate",     value: `${winRate}%`, icon: <TrendingUp size={16} />, color: "#10b981" },
            { label: "Wins / Losses", value: `${wins} / ${losses}`, icon: <CheckCircle2 size={16} />, color: "#f59e0b" },
            {
              label: "Total P&L",
              value: `${totalPnL >= 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
              icon: totalPnL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
              color: totalPnL >= 0 ? "#10b981" : "#ef4444",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: stat.color, marginBottom: "6px", fontSize: "12px", fontWeight: "600" }}>
                {stat.icon}
                {stat.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color, letterSpacing: "-0.5px" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Tabs ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: isActive ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--border)",
                background: isActive ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                color: isActive ? "var(--accent-purple)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: isActive ? "700" : "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.key !== "all" && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "20px",
                    background: isActive ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "var(--accent-purple)" : "var(--text-secondary)",
                  }}
                >
                  {tab.key === "open"   ? trades.filter((t) => (t as any).status === "open").length
                   : tab.key === "closed" ? trades.filter((t) => (t as any).status !== "open").length
                   : tab.key === "wins"   ? wins
                   : losses}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <Filter size={12} />
          {filteredTrades.length} record{filteredTrades.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Trade List ────────────────────────────────────────────────────── */}
      <Card
        title="Transaction Ledger"
        subtitle="Click any row to reveal Signal DNA, Journal notes & AI review"
      >
        {loading ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            <RefreshCw className="spin-animation" style={{ color: "var(--accent-purple)" }} size={16} />
            <span>Loading trade history...</span>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div style={{ padding: "60px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              No trades in this category
            </div>
            <div style={{ fontSize: "12px" }}>
              {activeTab === "all"
                ? "Buy and sell virtual positions in Trade Workspace to record trades."
                : `Switch to another filter or execute more trades.`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTrades.map((trade) => {
              const isExpanded = expandedTradeId === trade.id;
              const isWin = trade.profit_loss >= 0;
              const isOpen = (trade as any).status === "open";

              return (
                <div
                  key={trade.id}
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${isOpen ? "rgba(139,92,246,0.2)" : isWin ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                    background: isOpen
                      ? "rgba(139,92,246,0.04)"
                      : isWin
                      ? "rgba(16,185,129,0.03)"
                      : "rgba(239,68,68,0.03)",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* ── Row ─────────────────────────────────────────────── */}
                  <div
                    onClick={() => toggleExpand(trade.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 100px 90px 90px 90px 1fr 80px 28px",
                      alignItems: "center",
                      gap: "12px",
                      padding: "13px 16px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {/* Win/Loss icon */}
                    <div>
                      {isOpen
                        ? <Clock size={16} color="var(--accent-purple)" />
                        : isWin
                        ? <TrendingUp size={16} color="#10b981" />
                        : <TrendingDown size={16} color="#ef4444" />}
                    </div>

                    {/* Symbol */}
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>
                        {trade.symbol}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                        {isOpen ? "OPEN POSITION" : trade.exit_date ? fmtDate(trade.exit_date) : fmtDate(trade.created_at)}
                      </div>
                    </div>

                    {/* Entry */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px" }}>Entry</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                        ₹{Number(trade.entry_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Exit */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px" }}>Exit</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: isOpen ? "var(--text-secondary)" : "#fff" }}>
                        {isOpen ? "—" : `₹${Number(trade.exit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                      </div>
                    </div>

                    {/* Qty */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px" }}>Qty</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                        {trade.quantity}
                      </div>
                    </div>

                    {/* P&L */}
                    <div style={{ textAlign: "right" }}>
                      {!isOpen && (
                        <>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: "800",
                              color: isWin ? "#10b981" : "#ef4444",
                              letterSpacing: "-0.3px",
                            }}
                          >
                            {isWin ? "+" : ""}₹{Math.abs(trade.profit_loss).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: "11px", color: isWin ? "#10b981" : "#ef4444", opacity: 0.8 }}>
                            ({isWin ? "+" : ""}{trade.profit_loss_percent.toFixed(2)}%)
                          </div>
                        </>
                      )}
                    {!isOpen && (
                      <Badge variant={isOpen ? "info" : isWin ? "success" : "danger"}>
                        {isOpen ? "OPEN" : isWin ? "WIN" : "LOSS"}
                      </Badge>
                    )}
                    {isOpen && (
                      <Badge variant="info">Open</Badge>
                    )}
                    </div>

                    {/* Result badge */}
                    <div style={{ textAlign: "center" }}>
                      {isOpen
                        ? <Badge variant="info">OPEN</Badge>
                        : isWin
                        ? <Badge variant="success">WIN</Badge>
                        : <Badge variant="danger">LOSS</Badge>}
                    </div>

                    {/* Expand chevron */}
                    <div style={{ color: "var(--text-secondary)" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* ── Expanded Detail ──────────────────────────────────── */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        padding: "16px 16px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        {/* Signal DNA */}
                        {trade.signal_dna && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: "var(--accent-purple)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "10px",
                              }}
                            >
                              <Cpu size={12} /> Signal DNA
                            </div>
                            {[
                              { label: "Opportunity", val: trade.signal_dna.opportunityScore },
                              { label: "Timing",      val: trade.signal_dna.timingScore },
                              { label: "Confidence",  val: trade.signal_dna.confidenceScore },
                              { label: "Sector Str.", val: trade.signal_dna.sectorStrength },
                            ].map((item) => (
                              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.label}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div
                                    style={{
                                      width: "60px",
                                      height: "4px",
                                      borderRadius: "2px",
                                      background: "rgba(255,255,255,0.08)",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${item.val}%`,
                                        height: "100%",
                                        background: item.val >= 75 ? "#10b981" : item.val >= 50 ? "#f59e0b" : "#ef4444",
                                        borderRadius: "2px",
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff", width: "22px", textAlign: "right" }}>
                                    {item.val}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Journal */}
                        {trade.journal && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: "#f59e0b",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "10px",
                              }}
                            >
                              <BookOpen size={12} /> Trade Journal
                            </div>
                            {trade.journal.beforeEntry?.reason && (
                              <div style={{ marginBottom: "8px" }}>
                                <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "3px" }}>Entry Reason</div>
                                <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.5", fontStyle: "italic" }}>
                                  "{trade.journal.beforeEntry.reason}"
                                </div>
                              </div>
                            )}
                            {trade.journal.afterExit?.whatHappened && !isOpen && (
                              <div>
                                <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "3px" }}>What Happened</div>
                                <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.5", fontStyle: "italic" }}>
                                  "{trade.journal.afterExit.whatHappened}"
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Review */}
                        {trade.ai_review && !isOpen && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: "#10b981",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "10px",
                              }}
                            >
                              <Sparkles size={12} /> AI Review
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: isWin ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                  border: `1px solid ${isWin ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                }}
                              >
                                <span style={{ fontSize: "15px", fontWeight: "800", color: isWin ? "#10b981" : "#ef4444" }}>
                                  {trade.ai_review.score.toFixed(1)}
                                </span>
                                <span style={{ fontSize: "8px", color: "var(--text-secondary)" }}>/ 10</span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                {trade.ai_review.analysis.slice(0, 100)}...
                              </div>
                            </div>
                            {trade.ai_review.strengths.length > 0 && (
                              <div>
                                {trade.ai_review.strengths.map((s, i) => (
                                  <div key={i} style={{ fontSize: "11px", color: "#10b981", marginBottom: "3px" }}>
                                    ✓ {s}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div style={{ display: "flex", gap: "20px", fontSize: "11px", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <span>📅 Entry: {fmtDate(trade.entry_date || trade.created_at)}</span>
                        {!isOpen && trade.exit_date && (
                          <span>🏁 Exit: {fmtDate(trade.exit_date)}</span>
                        )}
                        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "10px", opacity: 0.5 }}>
                          ID: {trade.id}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;
