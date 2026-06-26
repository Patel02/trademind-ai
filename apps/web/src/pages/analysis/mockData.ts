export interface StockData {
  symbol: string;
  name: string;
  aiScore: number;
  readinessScore: number;
  riskLevel: "Low" | "Medium" | "High";
  marketRegime: "Bullish" | "Bearish" | "Neutral";
  lastUpdated: string;
  verdict: string;
  confidence: number;
  
  // AI Brain
  brain: {
    technicals: number;
    news: number;
    trend: number;
    volume: number;
    risk: number;
  };

  // Debate
  debate: {
    bullCase: string[];
    bearCase: string[];
    conclusion: string;
  };

  // Explainability
  explain: {
    technicals: number;
    news: number;
    trend: number;
    volume: number;
    risk: number;
  };

  // Timeline (30 days of scores)
  timeline: number[];

  // News Impacts
  newsImpacts: {
    title: string;
    time: string;
    impact: "Bullish" | "Bearish" | "Neutral";
    score: number;
    duration: "Short Term" | "Medium Term" | "Long Term";
    summary: string;
  }[];
}

export const mockStocksData: { [key: string]: StockData } = {
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    aiScore: 89,
    readinessScore: 84,
    riskLevel: "Medium",
    marketRegime: "Bullish",
    lastUpdated: "30 sec ago",
    verdict: "TCS displays strong bullish momentum. Positive news sentiment combined with improving volume and technical breakouts support the continuation of the current uptrend. Risk remains moderate due to sector multiples.",
    confidence: 87,
    brain: {
      technicals: 92,
      news: 81,
      trend: 88,
      volume: 79,
      risk: 72,
    },
    debate: {
      bullCase: [
        "Major cloud partnership with European retail giant improves long-term revenue visibility.",
        "Breakout above ₹3,800 key resistance level on heavy trading volume.",
        "MACD bullish crossover on the daily chart indicates rising momentum."
      ],
      bearCase: [
        "Immediate resistance nearby at ₹3,920 (previous all-time high).",
        "Overall IT sector volatility due to global macroeconomic uncertainties."
      ],
      conclusion: "The bullish cases carry significantly higher weight. Volume expansion on breakout confirms institutional participation, rendering the risk-reward ratio highly favorable for long positions."
    },
    explain: {
      technicals: 35,
      news: 22,
      trend: 18,
      volume: 14,
      risk: -5
    },
    timeline: [72, 73, 72, 74, 76, 75, 77, 79, 78, 80, 81, 80, 82, 83, 82, 84, 85, 84, 85, 87, 86, 85, 87, 88, 87, 88, 89, 89, 88, 89],
    newsImpacts: [
      {
        title: "TCS signs strategic cloud migration deal with European Retail leader",
        time: "10 mins ago",
        impact: "Bullish",
        score: 88,
        duration: "Medium Term",
        summary: "This contract improves long-term billing outlook. Expected to sustain operating margins within the 25-26% corridor."
      },
      {
        title: "IT index consolidates ahead of federal rate decision comments",
        time: "2 hours ago",
        impact: "Neutral",
        score: 52,
        duration: "Short Term",
        summary: "Macro sector consolidation. No direct changes to TCS micro fundamentals, but limits near-term multiple expansions."
      }
    ]
  },
  INFY: {
    symbol: "INFY",
    name: "Infosys Limited",
    aiScore: 81,
    readinessScore: 78,
    riskLevel: "Medium",
    marketRegime: "Neutral",
    lastUpdated: "1 min ago",
    verdict: "Infosys is showing signs of consolidation. Technical indicators are neutral after returning from oversold levels. While news sentiment remains positive, volume needs to rise further to sustain a full breakout.",
    confidence: 76,
    brain: {
      technicals: 74,
      news: 85,
      trend: 76,
      volume: 70,
      risk: 75,
    },
    debate: {
      bullCase: [
        "Strategic multi-year AI integration deal signed with global manufacturing conglomerate.",
        "Successful bounce off ₹1,420 support zone confirms strong demand at lower valuation bounds."
      ],
      bearCase: [
        "ADR pricing signals flat opening, reflecting near-term indecisiveness in foreign markets.",
        "Moving averages are currently clustered, indicating a range-bound channel."
      ],
      conclusion: "Neutral outlook in the short term. Accumulation on dips near support levels is favored over chasing current pricing until volume spikes confirm a bullish continuation channel."
    },
    explain: {
      technicals: 25,
      news: 28,
      trend: 15,
      volume: 18,
      risk: -5
    },
    timeline: [85, 84, 83, 82, 80, 78, 77, 76, 75, 74, 73, 75, 74, 76, 75, 78, 77, 76, 78, 79, 80, 78, 79, 80, 81, 80, 79, 81, 80, 81],
    newsImpacts: [
      {
        title: "Infosys partners with Nvidia to deploy generative AI solutions globally",
        time: "1 hour ago",
        impact: "Bullish",
        score: 82,
        duration: "Long Term",
        summary: "Strengthens competitive position in the AI enterprise services market. Expect positive margin impact starting FY27."
      },
      {
        title: "Foreign institutions trim allocations in large-cap Indian technology scripts",
        time: "5 hours ago",
        impact: "Bearish",
        score: 35,
        duration: "Medium Term",
        summary: "Sector-wide FII outflow exerts pressure on top-line valuations. INFY might trade rangebound in the near term."
      }
    ]
  },
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    aiScore: 87,
    readinessScore: 81,
    riskLevel: "Low",
    marketRegime: "Bullish",
    lastUpdated: "45 sec ago",
    verdict: "Reliance continues its strong performance driven by retail expansions and positive energy segment margins. High institutional backing and low risk metrics support a sustained uptrend.",
    confidence: 90,
    brain: {
      technicals: 85,
      news: 90,
      trend: 89,
      volume: 78,
      risk: 88, // high score means low risk risk-readiness
    },
    debate: {
      bullCase: [
        "Retail division records 18% YoY EBITDA expansion.",
        "Favorable GRM margins support healthy cash generation in the oil-to-chemicals segment.",
        "Strong institutional support from domestic pension funds."
      ],
      bearCase: [
        "Capex allocations for 5G rollouts remain high, limiting near-term dividend growth.",
        "Crude oil price fluctuations may induce short-term refining margin volatility."
      ],
      conclusion: "Highly secure investment thesis. Strong sector fundamentals and cash generation capabilities make it a solid core holding in the current market environment."
    },
    explain: {
      technicals: 30,
      news: 25,
      trend: 20,
      volume: 15,
      risk: -3
    },
    timeline: [82, 83, 84, 83, 85, 84, 86, 85, 86, 87, 86, 87, 85, 86, 87, 87, 88, 87, 88, 89, 88, 89, 87, 88, 89, 88, 87, 88, 87, 87],
    newsImpacts: [
      {
        title: "Reliance Retail acquires rights for global luxury brands in premium expansion",
        time: "30 mins ago",
        impact: "Bullish",
        score: 85,
        duration: "Medium Term",
        summary: "Boosts retail margins and luxury market share. Anticipate higher footfall and premiumization metrics."
      },
      {
        title: "Crude oil consolidates near $82 per barrel amid global demand updates",
        time: "3 hours ago",
        impact: "Neutral",
        score: 50,
        duration: "Short Term",
        summary: "Refining margins remain stable. No major deviations to earnings guidance expected for the quarter."
      }
    ]
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    aiScore: 75,
    readinessScore: 72,
    riskLevel: "High",
    marketRegime: "Neutral",
    lastUpdated: "2 mins ago",
    verdict: "HDFC Bank shows flat to negative short-term momentum. Post-merger margin compressions continue to weigh on investor sentiment, though valuation is historically attractive.",
    confidence: 65,
    brain: {
      technicals: 60,
      news: 72,
      trend: 68,
      volume: 82,
      risk: 58,
    },
    debate: {
      bullCase: [
        "Historical valuation multiples are at a 10-year discount, offering high margin of safety.",
        "Credit growth remains robust at 16% YoY, showing healthy retail loan demand."
      ],
      bearCase: [
        "Net Interest Margins (NIM) remain under pressure due to higher cost of funding post-merger.",
        "Foreign portfolio investors continue to trim banking holdings in favor of consumption sectors."
      ],
      conclusion: "Value play with near-term volatility. Suitable for long-term investors but short-term traders should wait for NIM stabilizing reports before initiating major leveraged positions."
    },
    explain: {
      technicals: 15,
      news: 22,
      trend: 18,
      volume: 25,
      risk: -10
    },
    timeline: [80, 78, 79, 78, 76, 75, 74, 75, 73, 72, 73, 72, 74, 73, 75, 74, 76, 75, 76, 75, 77, 76, 75, 76, 74, 75, 76, 75, 74, 75],
    newsImpacts: [
      {
        title: "HDFC Bank deposit growth matches credit expansion targets in Q1 update",
        time: "4 hours ago",
        impact: "Bullish",
        score: 74,
        duration: "Medium Term",
        summary: "Alleviates concerns regarding liquidity tightness. Shows bank is successfully sourcing retail deposits."
      },
      {
        title: "Banking sector faces headwinds from regulatory changes on liquidity buffers",
        time: "1 day ago",
        impact: "Bearish",
        score: 40,
        duration: "Long Term",
        summary: "May require bank to hold higher low-yielding liquid assets, marginally hitting NIM forecasts for the fiscal year."
      }
    ]
  }
};

export const sectorStrengthRadar = [
  { name: "IT Services", score: 91, trend: "up" },
  { name: "Banking & Finance", score: 88, trend: "up" },
  { name: "Automotive", score: 82, trend: "flat" },
  { name: "FMCG", score: 61, trend: "down" },
  { name: "Metals & Mining", score: 58, trend: "down" },
];

export const opportunityRanking = [
  { rank: "#1", symbol: "TCS", score: 89, prevScore: 81, trend: "improving" },
  { rank: "#2", symbol: "RELIANCE", score: 87, prevScore: 84, trend: "improving" },
  { rank: "#3", symbol: "INFY", score: 81, prevScore: 80, trend: "stable" },
  { rank: "#4", symbol: "HDFCBANK", score: 75, prevScore: 78, trend: "declining" },
];
