export interface WorkspaceSymbol {
  id: string;
  name: string;
  displayName: string;
  exchange: string;
  tvSymbol: string; // TradingView format: "NSE:TCS"
  sector: string;
  currentPrice: number;
  change: number;
  changePct: number;
}

export interface WorkspaceAIData {
  opportunityScore: number;
  timingScore: number;
  riskScore: number;
  confidenceScore: number;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  opportunityStatus: 'Elite Opportunity' | 'Strong Opportunity' | 'Watch Closely' | 'Avoid';

  // Signal DNA breakdown
  technicalScore: number;
  newsScore: number;
  sectorScore: number;
  trendScore: number;
  volumeScore: number;

  // Signal levels
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;

  // Scenario analysis
  bullishScenario: string;
  bearishScenario: string;
  suggestedApproach: string;
}

export interface WorkspaceMarketContext {
  regime: 'Bull Market' | 'Bear Market' | 'Sideways Market' | 'High Volatility';
  regimeConfidence: number;
  sector: string;
  sectorStrength: number;
  sectorTrend: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface WorkspaceCoachInsight {
  icon: string; // emoji
  title: string;
  message: string;
  type: 'positive' | 'neutral' | 'caution';
}

export interface WorkspaceData {
  symbol: WorkspaceSymbol;
  ai: WorkspaceAIData;
  market: WorkspaceMarketContext;
  insights: WorkspaceCoachInsight[];
}
