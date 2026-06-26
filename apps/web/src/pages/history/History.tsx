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
  Calendar,
  Search,
} from "lucide-react";
import {
  paperTradingService,
  type PaperClosedTrade,
} from "../../features/paper-trading/paper-trading.service";
import { useLocation } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";

// ── Constants ─────────────────────────────────────────────────────────────────
type FilterTab = "all" | "open" | "closed" | "wins" | "losses";

const TAB_CONFIG: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all",    label: "All Trades", icon: <BarChart2 size={13} /> },
  { key: "open",   label: "Open",       icon: <Clock size={13} /> },
  { key: "closed", label: "Closed",     icon: <CheckCircle2 size={13} /> },
  { key: "wins",   label: "Wins",       icon: <TrendingUp size={13} /> },
  { key: "losses", label: "Losses",     icon: <TrendingDown size={13} /> },
];

const SYMBOLS = ["ALL", "TCS", "RELIANCE", "INFY", "HDFCBANK"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtINR = (n: number, dec = 2) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ── Component ─────────────────────────────────────────────────────────────────
export const History: React.FC = () => {
  const [trades,          setTrades]          = useState<PaperClosedTrade[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [activeTab,       setActiveTab]       = useState<FilterTab>("all");
  const [symbolFilter,    setSymbolFilter]    = useState("ALL");   // H3
  const [setupTypeFilter, setSetupTypeFilter] = useState("ALL");   // H4 Setup Type
  const [dateFrom,        setDateFrom]        = useState("");       // H2
  const [dateTo,          setDateTo]          = useState("");       // H2

  const location = useLocation();

  // H4 Routing: Pre-select tab based on URL path (/history/wins or /history/losses)
  useEffect(() => {
    if (location.pathname.endsWith("/wins")) {
      setActiveTab("wins");
    } else if (location.pathname.endsWith("/losses")) {
      setActiveTab("losses");
    }
  }, [location.pathname]);

  // ── Load all trades (open + closed) from Supabase ──────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await paperTradingService.getAllTrades();   // A4: use unified method
      setTrades(all);
    } catch (err) {
      console.error("[History] loadData failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Live reload when a trade is placed
  useEffect(() => {
    const handler = () => { loadData(); };
    window.addEventListener("trademind:markers-updated", handler);
    return () => window.removeEventListener("trademind:markers-updated", handler);
  }, [loadData]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filteredTrades = trades.filter((t) => {
    // Tab filter — A3: use t.status directly (no cast)
    if (activeTab === "open"   && t.status !== "open")   return false;
    if (activeTab === "closed" && t.status === "open")   return false;
    if (activeTab === "wins"   && (t.status === "open" || t.profit_loss < 0))  return false;
    if (activeTab === "losses" && (t.status === "open" || t.profit_loss >= 0)) return false;

    // Symbol filter — H3
    if (symbolFilter !== "ALL" && t.symbol !== symbolFilter) return false;

    // Setup Type filter
    if (setupTypeFilter !== "ALL" && (t.signal_dna?.setupType || "Bullish Breakout") !== setupTypeFilter) return false;

    // Date range filter — H2
    if (dateFrom && new Date(t.entry_date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(t.entry_date) > new Date(dateTo + "T23:59:59")) return false;

    return true;
  });

  // ── Summary stats (only closed trades for P&L stats) ──────────────────────
  const closedTrades  = trades.filter((t) => t.status !== "open");
  const openCount     = trades.filter((t) => t.status === "open").length;
  const wins          = closedTrades.filter((t) => t.profit_loss >= 0).length;
  const losses        = closedTrades.filter((t) => t.profit_loss < 0).length;
  const totalPnL      = closedTrades.reduce((s, t) => s + t.profit_loss, 0);
  const winRate       = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;

  // Tab count helpers
  const countFor = (tab: FilterTab): number => {
    if (tab === "all")    return trades.length;
    if (tab === "open")   return openCount;
    if (tab === "closed") return closedTrades.length;
    if (tab === "wins")   return wins;
    return losses;
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", color: "var(--text-primary)" }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            Trade History Ledger
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
            All paper trades — persistent across sessions, devices &amp; logins
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: "8px 14px", borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "12.5px", fontFamily: "inherit",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Summary Stats Row ─────────────────────────────────────────────── */}
      {!loading && trades.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            {
              label: "Total Trades",
              value: `${trades.length} (${openCount} open)`,
              icon: <BarChart2 size={16} />,
              color: "var(--accent-purple)",
            },
            {
              label: "Win Rate",
              value: `${winRate}%`,
              icon: <TrendingUp size={16} />,
              color: "#10b981",
            },
            {
              label: "Wins / Losses",
              value: `${wins} / ${losses}`,
              icon: <CheckCircle2 size={16} />,
              color: "#f59e0b",
            },
            {
              label: "Realized P&L",
              value: `${totalPnL >= 0 ? "+" : ""}₹${fmtINR(Math.abs(totalPnL), 0)}`,
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
                {stat.icon} {stat.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: stat.color, letterSpacing: "-0.5px" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters Row ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Tab filters */}
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = countFor(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "7px 14px", borderRadius: "8px",
                border: isActive ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--border)",
                background: isActive ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                color: isActive ? "var(--accent-purple)" : "var(--text-secondary)",
                cursor: "pointer", fontSize: "12px",
                fontWeight: isActive ? "700" : "500",
                display: "flex", alignItems: "center", gap: "6px",
                fontFamily: "inherit", transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.key !== "all" && (
                <span style={{
                  fontSize: "10px", padding: "1px 6px", borderRadius: "20px",
                  background: isActive ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                  color: isActive ? "var(--accent-purple)" : "var(--text-secondary)",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Symbol filter — H3 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Search size={12} style={{ color: "var(--text-secondary)" }} />
          <select
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: symbolFilter !== "ALL" ? "var(--accent-purple)" : "var(--text-secondary)",
              fontSize: "12px", cursor: "pointer",
              fontFamily: "inherit", outline: "none",
            }}
          >
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Setup Type filter — H4 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <BookOpen size={12} style={{ color: "var(--text-secondary)" }} />
          <select
            value={setupTypeFilter}
            onChange={(e) => setSetupTypeFilter(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: setupTypeFilter !== "ALL" ? "var(--accent-purple)" : "var(--text-secondary)",
              fontSize: "12px", cursor: "pointer",
              fontFamily: "inherit", outline: "none",
            }}
          >
            {["ALL", "Bullish Breakout", "Pullback Recovery", "Volatility Squeeze", "Support Bounce"].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Date range filter — H2 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={12} style={{ color: "var(--text-secondary)" }} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "5px 8px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: dateFrom ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: "11px", fontFamily: "inherit",
              outline: "none", cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "5px 8px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: dateTo ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: "11px", fontFamily: "inherit",
              outline: "none", cursor: "pointer",
            }}
          />
          {(dateFrom || dateTo || symbolFilter !== "ALL") && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setSymbolFilter("ALL"); }}
              style={{
                padding: "4px 8px", borderRadius: "6px",
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                color: "#ef4444", cursor: "pointer",
                fontSize: "10px", fontFamily: "inherit",
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <Filter size={12} />
          {filteredTrades.length} record{filteredTrades.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Trade List ────────────────────────────────────────────────────── */}
      <Card
        title="Transaction Ledger"
        subtitle="Click any row to reveal Signal DNA, Journal notes &amp; AI review"
      >
        {loading ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            <RefreshCw className="spin-animation" style={{ color: "var(--accent-purple)" }} size={16} />
            <span>Loading trade history from database...</span>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div style={{ padding: "60px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
              No trades in this category
            </div>
            <div style={{ fontSize: "12px" }}>
              {activeTab === "all" && symbolFilter === "ALL" && !dateFrom && !dateTo
                ? "Buy and sell virtual positions in Trade Workspace to record trades."
                : "Try adjusting filters or switching to a different tab."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTrades.map((trade) => {
              const isExpanded = expandedId === trade.id;
              const isOpen     = trade.status === "open";     // A3: no cast needed
              const isWin      = !isOpen && trade.profit_loss >= 0;

              const rowBorder = isOpen
                ? "rgba(139,92,246,0.2)"
                : isWin ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";
              const rowBg = isOpen
                ? "rgba(139,92,246,0.04)"
                : isWin ? "rgba(16,185,129,0.03)" : "rgba(239,68,68,0.03)";

              return (
                <div
                  key={trade.id}
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${rowBorder}`,
                    background: rowBg,
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* ── Row ─────────────────────────────────────────── */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 110px 95px 95px 70px 1fr 80px 28px",
                      alignItems: "center",
                      gap: "12px",
                      padding: "13px 16px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {/* Status icon */}
                    <div>
                      {isOpen
                        ? <Clock size={16} color="var(--accent-purple)" />
                        : isWin
                        ? <TrendingUp size={16} color="#10b981" />
                        : <TrendingDown size={16} color="#ef4444" />}
                    </div>

                    {/* Symbol + date */}
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>
                        {trade.symbol}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                        {isOpen
                          ? "OPEN POSITION"
                          : fmtDate(trade.exit_date ?? trade.entry_date)}
                      </div>
                    </div>

                    {/* Entry */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px" }}>Entry</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                        ₹{fmtINR(trade.entry_price)}
                      </div>
                    </div>

                    {/* Exit */}
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "2px" }}>Exit</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: isOpen ? "var(--text-secondary)" : "#fff" }}>
                        {isOpen ? "—" : `₹${fmtINR(trade.exit_price)}`}
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
                          <div style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "-0.3px", color: isWin ? "#10b981" : "#ef4444" }}>
                            {isWin ? "+" : ""}₹{fmtINR(Math.abs(trade.profit_loss))}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.8, color: isWin ? "#10b981" : "#ef4444" }}>
                            ({isWin ? "+" : ""}{trade.profit_loss_percent.toFixed(2)}%)
                          </div>
                        </>
                      )}
                      {isOpen && (
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                          running…
                        </div>
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

                    {/* Expand */}
                    <div style={{ color: "var(--text-secondary)" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* ── Expanded Detail ──────────────────────────────── */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      padding: "16px 16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        {/* Signal DNA */}
                        {trade.signal_dna && (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
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
                                  <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                                    <div style={{
                                      width: `${item.val}%`, height: "100%", borderRadius: "2px",
                                      background: item.val >= 75 ? "#10b981" : item.val >= 50 ? "#f59e0b" : "#ef4444",
                                    }} />
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
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
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
                            {!isOpen && trade.journal.afterExit?.whatHappened && (
                              <div>
                                <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "3px" }}>What Happened</div>
                                <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.5", fontStyle: "italic" }}>
                                  "{trade.journal.afterExit.whatHappened}"
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Review — only for closed trades */}
                        {!isOpen && trade.ai_review && (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                              <Sparkles size={12} /> AI Review
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                              <div style={{
                                width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                                background: isWin ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                border: `1px solid ${isWin ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                              }}>
                                <span style={{ fontSize: "15px", fontWeight: "800", color: isWin ? "#10b981" : "#ef4444" }}>
                                  {trade.ai_review.score.toFixed(1)}
                                </span>
                                <span style={{ fontSize: "8px", color: "var(--text-secondary)" }}>/ 10</span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                                {trade.ai_review.analysis.slice(0, 100)}…
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

                      {/* Timestamps row */}
                      <div style={{
                        display: "flex", gap: "20px", fontSize: "11px",
                        color: "var(--text-secondary)",
                        borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px",
                      }}>
                        <span>📅 Entry: {fmtDate(trade.entry_date)}</span>
                        {!isOpen && trade.exit_date && (
                          <span>🏁 Exit: {fmtDate(trade.exit_date)}</span>
                        )}
                        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "10px", opacity: 0.5 }}>
                          ID: {trade.id}  ·  Status: {trade.status}
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
