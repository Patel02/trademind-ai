import { signalsService } from "../../signals/signals.service";
import type {
  WorkspaceData,
  WorkspaceSymbol,
  WorkspaceAIData,
  WorkspaceMarketContext,
  WorkspaceCoachInsight,
} from "../types";

// Available symbols with metadata
export const WORKSPACE_SYMBOLS: WorkspaceSymbol[] = [
  {
    id: "TCS",
    name: "Tata Consultancy Services",
    displayName: "TCS",
    exchange: "NSE",
    tvSymbol: "NSE:TCS",
    sector: "IT Services",
    currentPrice: 3845.20,
    change: 38.50,
    changePct: 1.01,
  },
  {
    id: "RELIANCE",
    name: "Reliance Industries",
    displayName: "RELIANCE",
    exchange: "NSE",
    tvSymbol: "NSE:RELIANCE",
    sector: "Energy & Infra",
    currentPrice: 2950.40,
    change: -12.30,
    changePct: -0.42,
  },
  {
    id: "INFY",
    name: "Infosys Limited",
    displayName: "INFY",
    exchange: "NSE",
    tvSymbol: "NSE:INFY",
    sector: "IT Services",
    currentPrice: 1490.50,
    change: 22.10,
    changePct: 1.50,
  },
  {
    id: "HDFCBANK",
    name: "HDFC Bank Limited",
    displayName: "HDFCBANK",
    exchange: "NSE",
    tvSymbol: "NSE:HDFCBANK",
    sector: "Financials",
    currentPrice: 1560.10,
    change: -5.40,
    changePct: -0.35,
  },
];

// Per-symbol sector strength map
const sectorData: Record<string, { sector: string; strength: number; trend: 'Bullish' | 'Neutral' | 'Bearish' }> = {
  TCS:      { sector: "IT Services",   strength: 91, trend: "Bullish" },
  RELIANCE: { sector: "Energy & Infra",strength: 82, trend: "Bullish" },
  INFY:     { sector: "IT Services",   strength: 91, trend: "Bullish" },
  HDFCBANK: { sector: "Financials",    strength: 74, trend: "Neutral"  },
};

// Generate per-symbol AI coaching insights from live AI score
const buildInsights = (symbol: string, ai: WorkspaceAIData): WorkspaceCoachInsight[] => {
  const insights: WorkspaceCoachInsight[] = [];

  // Opportunity status insight
  if (ai.opportunityScore >= 85) {
    insights.push({ icon: "🎯", title: "High Opportunity Zone", message: `${symbol} is showing strong AI setup alignment. All major parameters above threshold.`, type: "positive" });
  } else if (ai.opportunityScore >= 70) {
    insights.push({ icon: "📊", title: "Moderate Opportunity", message: `${symbol} setup is developing. Monitor for volume confirmation before entry.`, type: "neutral" });
  } else {
    insights.push({ icon: "⚠️", title: "Low Conviction Setup", message: `${symbol} parameters are mixed. Wait for clearer signal before committing capital.`, type: "caution" });
  }

  // Technical / trend insight
  if (ai.trend === "Bullish") {
    insights.push({ icon: "📈", title: "Bullish Price Structure", message: "EMA alignment is bullish. Higher highs pattern forming on daily timeframe.", type: "positive" });
  } else if (ai.trend === "Bearish") {
    insights.push({ icon: "📉", title: "Bearish Momentum", message: "Price below key moving averages. Await structure recovery before entry.", type: "caution" });
  } else {
    insights.push({ icon: "↔️", title: "Sideways Consolidation", message: "Price in consolidation zone. Watch for breakout above resistance with volume.", type: "neutral" });
  }

  // News sentiment
  if (ai.newsScore >= 80) {
    insights.push({ icon: "📰", title: "Positive News Sentiment", message: "Recent news catalysts are favorable. Institutional attention is elevated.", type: "positive" });
  } else if (ai.newsScore < 60) {
    insights.push({ icon: "🔇", title: "Neutral/Mixed News", message: "No major news catalysts present. Setup is technical in nature.", type: "neutral" });
  }

  // Volume insight
  if (ai.volumeScore >= 80) {
    insights.push({ icon: "🔊", title: "Volume Surge Detected", message: "Above-average volume supports the current move. Smart money participation visible.", type: "positive" });
  }

  // Risk insight
  if (ai.riskScore > 60) {
    insights.push({ icon: "🛡️", title: "Risk Alert", message: `Risk score elevated at ${ai.riskScore}/100. Position sizing should be conservative.`, type: "caution" });
  } else {
    insights.push({ icon: "✅", title: "Controlled Risk Profile", message: `Risk is within acceptable range (${ai.riskScore}/100). Stop-loss at ₹${ai.stopLoss.toLocaleString()}.`, type: "positive" });
  }

  return insights.slice(0, 4); // Max 4 insights
};

export const workspaceService = {
  /**
   * Get full workspace data for a given symbol
   */
  async getWorkspaceData(symbolId: string): Promise<WorkspaceData> {
    // Resolve symbol metadata
    const symbolMeta = WORKSPACE_SYMBOLS.find((s) => s.id === symbolId) || WORKSPACE_SYMBOLS[0];

    // Fetch AI score from signals service
    const [signals, breakdown, regime] = await Promise.all([
      signalsService.getSignals(),
      signalsService.getBreakdown(symbolId),
      signalsService.getMarketRegime(),
    ]);

    const match = signals.find((s) => s.symbol === symbolId);

    // Build AI data — use live signal data if available, else derive from breakdown
    const ai: WorkspaceAIData = {
      opportunityScore:  match?.score ?? 75,
      timingScore:       match?.trade_readiness ?? 70,
      riskScore:         match?.risk === "High" ? 70 : match?.risk === "Medium" ? 45 : 25,
      confidenceScore:   match?.confidence ?? 72,
      trend:             match?.trend ?? "Neutral",
      opportunityStatus: match?.opportunity_status ?? "Watch Closely",

      technicalScore: breakdown?.technical_score ?? 75,
      newsScore:      breakdown?.news_score ?? 70,
      sectorScore:    breakdown?.sector_score ?? 78,
      trendScore:     breakdown?.trend_score ?? 74,
      volumeScore:    breakdown?.volume_score ?? 70,

      entryZoneLow:   match?.entry_zone_low  ?? Number((symbolMeta.currentPrice * 0.993).toFixed(1)),
      entryZoneHigh:  match?.entry_zone_high ?? Number((symbolMeta.currentPrice * 1.007).toFixed(1)),
      stopLoss:       match?.stop_loss       ?? Number((symbolMeta.currentPrice * 0.975).toFixed(1)),
      target1:        match?.target_1        ?? Number((symbolMeta.currentPrice * 1.018).toFixed(1)),
      target2:        match?.target_2        ?? Number((symbolMeta.currentPrice * 1.035).toFixed(1)),
      target3:        match?.target_3        ?? Number((symbolMeta.currentPrice * 1.055).toFixed(1)),

      bullishScenario:   match?.bullish_scenario   ?? `If ${symbolId} sustains above entry zone, high probability of progression toward targets.`,
      bearishScenario:   match?.bearish_scenario   ?? `If ${symbolId} breaks below support, risk increases. Monitor stop-loss level.`,
      suggestedApproach: match?.suggested_approach ?? `Accumulate near entry zone on dips. Maintain strict stop-loss discipline.`,
    };

    // Build market context
    const secData = sectorData[symbolId] ?? { sector: "Diversified", strength: 75, trend: "Neutral" as const };
    const market: WorkspaceMarketContext = {
      regime:            regime.regime,
      regimeConfidence:  regime.confidence,
      sector:            secData.sector,
      sectorStrength:    secData.strength,
      sectorTrend:       secData.trend,
    };

    // Build AI coaching insights
    const insights: WorkspaceCoachInsight[] = buildInsights(symbolId, ai);

    // Hydrate current price from signal match
    if (match?.current_price) {
      symbolMeta.currentPrice = match.current_price;
    }

    return { symbol: symbolMeta, ai, market, insights };
  },

  getSymbols(): WorkspaceSymbol[] {
    return WORKSPACE_SYMBOLS;
  },
};

export default workspaceService;
