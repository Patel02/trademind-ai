import { paperTradingService } from "../paper-trading/paper-trading.service";
import { portfolioDoctorService } from "../portfolio-doctor/portfolio-doctor.service";
import { auditService } from "../../security/audit.service";

export const aiAssistantService = {
  /**
   * Processes a user message, fetches actual application context, matches intent, and returns a tailored response.
   */
  async sendMessage(query: string): Promise<string> {
    const q = query.toLowerCase().trim();
    
    // Log query in security audit logs
    try {
      await auditService.logAction("AI_ASSISTANT_QUERY", "ai-assistant", query, { status: "success" });
    } catch {
      // Fail silently
    }

    try {
      // 1. INTENT: Analyze TCS
      if (q.includes("analyze tcs") || (q.includes("tcs") && (q.includes("analyze") || q.includes("analysis") || q.includes("review")))) {
        const price = await paperTradingService.getStockPrice("TCS");
        const positions = await paperTradingService.getPositions();
        const tcsPos = positions.find((p) => p.symbol.toUpperCase() === "TCS");
        
        let positionInfo = "You do not currently hold an active position in TCS.";
        if (tcsPos && tcsPos.quantity > 0) {
          positionInfo = `You hold **${tcsPos.quantity}** shares of TCS with an average entry price of **₹${tcsPos.avg_price.toFixed(2)}** (Current Value: ₹${(tcsPos.quantity * price).toFixed(2)}, Unrealized PnL: ${tcsPos.unrealized_pnl >= 0 ? "+" : ""}${tcsPos.unrealized_pnl.toFixed(2)} [${((price - tcsPos.avg_price)/tcsPos.avg_price * 100).toFixed(2)}%]).`;
        }

        return `### TCS Stock Analysis
TCS is currently trading at **₹${price.toFixed(2)}**.

**Your Position:**
${positionInfo}

**Technical DNA & Market Intelligence:**
- **Opportunity Score:** 82 / 100 (Strong Bullish Momentum)
- **Sector Strength:** 85% (IT Services leading index support)
- **Support / Resistance:** Support at ₹3,800, Resistance at ₹3,920.
- **AI Recommendation:** Holding support at ₹3,800 remains critical. Sector indicators point to continued accumulation. If overweight (above 25% allocation), consider trimming to reduce concentration.`;
      }

      // 2. INTENT: Why is my portfolio risky?
      if (q.includes("risky") || q.includes("why is my portfolio risky") || q.includes("risk") || q.includes("concentration risk")) {
        const portfolio = await paperTradingService.getPortfolio();
        const positions = await paperTradingService.getPositions();
        const goal = (localStorage.getItem("trademind_portfolio_goal") as any) || "Balanced";
        const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);

        const riskFactors: string[] = [];
        if (diag.concentrationRisk.isHighRisk) {
          riskFactors.push(`- **High Concentration:** Top holding **${diag.concentrationRisk.topHoldingSymbol}** occupies **${diag.concentrationRisk.topHoldingPct}%** of your portfolio (Limit is ${diag.concentrationRisk.limit}% for ${goal} goal).`);
        }
        
        const itSec = diag.sectorAllocations.find(s => s.sector === "IT Services");
        const sectorExposureLimit = goal === "Conservative" ? 30 : goal === "Aggressive" ? 50 : 40;
        if (itSec && itSec.allocationPct > sectorExposureLimit) {
          riskFactors.push(`- **Sector Overexposure:** IT Services exposure is elevated at **${itSec.allocationPct}%** (Limit: ${sectorExposureLimit}%).`);
        }

        const minOptimalCash = goal === "Conservative" ? 20 : goal === "Aggressive" ? 5 : 10;
        if (diag.cashPct < minOptimalCash) {
          riskFactors.push(`- **Low Cash Buffer:** Your cash allocation is **${diag.cashPct}%**, falling below the minimum target of ${minOptimalCash}%. This limits liquid buying power.`);
        }

        if (diag.volatilityDrag > 5) {
          riskFactors.push(`- **Volatility Drag:** Your estimated volatility drag is **${diag.volatilityDrag}%**, indicating high intraday variance in returns.`);
        }

        if (riskFactors.length === 0) {
          riskFactors.push("- Your portfolio allocation aligns well with your risk targets. Volatility drag is optimal and holdings are well-balanced.");
        }

        return `### Portfolio Risk Audit
Your portfolio has a **${diag.riskIndex} Risk** profile with a Risk Index of **${diag.riskScore} / 100** (where lower is safer).

**Key Risk Contributors:**
${riskFactors.join("\n")}

**AI Recommendations to Hedge:**
- Trim positions exceeding concentration limits (e.g. keep stock weights below ${diag.concentrationRisk.limit}%).
- Divert capital into low-beta sectors like Financials or Energy & Infra to diversify IT systemic risks.`;
      }

      // 3. INTENT: Which sector should I add?
      if (q.includes("sector should i add") || q.includes("which sector") || q.includes("add sector") || q.includes("diversify")) {
        const portfolio = await paperTradingService.getPortfolio();
        const positions = await paperTradingService.getPositions();
        const goal = (localStorage.getItem("trademind_portfolio_goal") as any) || "Balanced";
        const diag = portfolioDoctorService.diagnosePortfolio(portfolio, positions, goal);

        const underexposed = diag.composition.filter(c => c.state === "Underexposed" || c.pct === 0);
        if (underexposed.length === 0) {
          return `### Sector Exposure Advice
Your portfolio is balanced across the main sectors. No major underexposures detected.`;
        }

        const suggestions = underexposed.map(u => {
          if (u.sector === "Financials") {
            return `- **Financials:** Currently **${u.pct}%** allocation. Recommend pilot purchasing **HDFCBANK** (Beta: 1.1) to introduce robust index defense.`;
          }
          if (u.sector === "Energy & Infra") {
            return `- **Energy & Infra:** Currently **${u.pct}%** allocation. Recommend buying **RELIANCE** (Beta: 1.0) to gain stable low-beta index hedge.`;
          }
          if (u.sector === "IT Services") {
            return `- **IT Services:** Currently **${u.pct}%** allocation. Recommend accumulation in **TCS** (Beta: 1.2) or **INFY** (Beta: 1.2) for growth momentum.`;
          }
          return `- **${u.sector}:** Currently **${u.pct}%** allocation. Consider adding standard setups to broaden coverage.`;
        });

        return `### Diversification Suggestions
To improve your **Diversification Score (${diag.diversificationScore}/100)**, consider allocating capital into these underexposed sectors:

${suggestions.join("\n")}

*By adding these sectors, you will hedge against systematic sector drops and raise your overall portfolio health score.*`;
      }

      // 4. INTENT: Show my best trade setup
      if (q.includes("best trade") || q.includes("best setup") || q.includes("my best trade")) {
        const closed = await paperTradingService.getClosedTrades();
        const positions = await paperTradingService.getPositions();

        let bestSymbol = "None";
        let bestReturnPct = -9999;
        let bestPnL = 0;
        let setupType = "N/A";
        let oppScore = 70;
        let isClosed = false;

        // Search in closed trades
        closed.forEach((t) => {
          if (t.profit_loss_percent > bestReturnPct) {
            bestReturnPct = t.profit_loss_percent;
            bestSymbol = t.symbol;
            bestPnL = t.profit_loss;
            setupType = t.signal_dna?.setupType || "Breakout Setup";
            oppScore = t.signal_dna?.opportunityScore || 75;
            isClosed = true;
          }
        });

        // Compare with open positions return
        await Promise.all(positions.map(async (p) => {
          const price = await paperTradingService.getStockPrice(p.symbol);
          const pct = ((price - p.avg_price) / p.avg_price) * 100;
          if (pct > bestReturnPct) {
            bestReturnPct = pct;
            bestSymbol = p.symbol;
            bestPnL = p.unrealized_pnl;
            setupType = p.signal_dna?.setupType || "Swing Setup";
            oppScore = p.signal_dna?.opportunityScore || 70;
            isClosed = false;
          }
        }));

        if (bestSymbol === "None" || bestReturnPct === -9999) {
          return `### Best Trade Setup
No trades or positions detected in your ledger. Place paper orders in the **Paper Trading** module to log trade setups.`;
        }

        return `### Your Best Trade Setup: ${bestSymbol}
Your highest-yielding trade setup was in **${bestSymbol}**, delivering a return of **${bestReturnPct > 0 ? "+" : ""}${bestReturnPct.toFixed(2)}%** (Profit: ₹${bestPnL.toLocaleString()}) [${isClosed ? "CLOSED" : "ACTIVE"}].

**Setup DNA Details:**
- **Setup Type:** ${setupType}
- **Opportunity Score:** ${oppScore}/100
- **Execution Reason:** Technical breakout support and momentum confirmations.
- **AI Performance Lesson:** You showed highly disciplined holding capability, allowing the trade to reach its maximum technical target rather than cutting profits early.`;
      }

      // 5. INTENT: What changed today?
      if (q.includes("changed today") || q.includes("what changed") || q.includes("today")) {
        const metrics = await paperTradingService.getPortfolioMetrics();
        const alerts = await portfolioDoctorService.getAlerts();
        const activeAlerts = alerts.filter(a => a.status === "active");

        let alertSection = "No active warnings or alerts on your portfolio today.";
        if (activeAlerts.length > 0) {
          alertSection = `You have **${activeAlerts.length}** active warnings:\n` + activeAlerts.map(a => `- [${a.alert_type}] ${a.message}`).join("\n");
        }

        return `### Daily Portfolio Health Check
Here is a summary of your portfolio value and changes:

**Portfolio Valuation:**
- **Net Asset Value (NAV):** ₹${metrics.totalPortfolioValue.toLocaleString()}
- **Cash Balance:** ₹${metrics.cashBalance.toLocaleString()} (${(metrics.cashBalance / metrics.totalPortfolioValue * 100).toFixed(1)}%)
- **Invested Amount:** ₹${metrics.investedAmount.toLocaleString()}
- **Total Inception Return:** ${metrics.totalReturnPct >= 0 ? "+" : ""}${metrics.totalReturnPct}%

**Smart Alerts ledger:**
${alertSection}`;
      }

      // 6. INTENT: Compare TCS vs INFY
      if (q.includes("compare tcs vs infy") || (q.includes("tcs") && q.includes("infy") && q.includes("compare"))) {
        const tcsPrice = await paperTradingService.getStockPrice("TCS");
        const infyPrice = await paperTradingService.getStockPrice("INFY");

        return `### Comparison: TCS vs INFY
Here is the comparative audit of the two top IT service components:

| Metric | TCS | INFY |
| :--- | :--- | :--- |
| **Current Price** | ₹${tcsPrice.toFixed(2)} | ₹${infyPrice.toFixed(2)} |
| **Beta (Regime Risk)** | 1.2 (Moderate Risk) | 1.2 (Moderate Risk) |
| **Sector Group** | IT Services | IT Services |
| **Opportunity Score** | 82 / 100 | 74 / 100 |
| **Technical Setup** | Bullish Breakout | Range Bound Consolidation |

**AI Assistant Verdict:**
Both companies exhibit identical beta weights (1.2), indicating a similar vulnerability to systematic market corrections. TCS exhibits stronger bullish momentum (Opportunity Score: 82 vs 74). Holding both creates high sectoral overlap; consider consolidating into TCS for momentum, or trimming one to keep overall IT Services exposure under 40%.`;
      }

      // 7. General FAQ Fallbacks
      return `Hello! I am your **TradeMind AI Assistant**. I provide context-aware insights about your active portfolio, trade setups, news and market intelligence.

Here are some specific queries I can help you with:
- **"Analyze TCS"** — Reviews TCS price, technical setup, and your position.
- **"Why is my portfolio risky?"** — Audits your asset concentration, sector weights, and liquidity.
- **"Which sector should I add?"** — Detects underexposed sectors to hedge risk.
- **"Show my best trade setup"** — Highlights your highest-yielding active or closed trade.
- **"What changed today?"** — Displays today's portfolio values and active smart alerts.
- **"Compare TCS vs INFY"** — Side-by-side technical comparison of TCS and INFY.

*How can I help you today?*`;

    } catch (error) {
      console.error("AI Assistant process error:", error);
      return "I encountered an issue gathering context from your portfolio. Please ensure you have virtual funds and active positions set up.";
    }
  }
};

export default aiAssistantService;
