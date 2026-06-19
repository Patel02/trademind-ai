import React from "react";
import type { NewsItem } from "./types";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { Clock, Sparkles } from "lucide-react";

interface NewsCardProps {
  item: NewsItem;
  onSymbolClick?: (symbol: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onSymbolClick }) => {
  // Map impact score (0-100) to level name
  const getImpactLevel = (score: number): { name: "Low" | "Medium" | "High" | "Extreme"; variant: "primary" | "warning" | "danger" | "success" } => {
    if (score < 30) return { name: "Low", variant: "primary" };
    if (score < 60) return { name: "Medium", variant: "warning" };
    if (score < 80) return { name: "High", variant: "danger" };
    return { name: "Extreme", variant: "danger" };
  };

  const getSentimentText = (score: number) => {
    if (score > 60) return { text: `Bullish (${score})`, sentiment: "bullish" as const };
    if (score < 40) return { text: `Bearish (${score})`, sentiment: "bearish" as const };
    return { text: `Neutral (${score})`, sentiment: "neutral" as const };
  };

  const impact = getImpactLevel(item.impact_score);
  const sentiment = getSentimentText(item.sentiment_score);

  // Format time elapsed
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "recently";
    }
  };

  return (
    <Card className="news-card-v2" style={{ position: "relative", overflow: "hidden" }}>
      {/* Top Meta info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
        <span style={{ fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.source}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {formatTime(item.published_at)}</span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: "15px", fontWeight: "750", margin: "0 0 12px", lineHeight: "1.4", color: "#fff" }}>
        {item.title}
      </h3>

      {/* Badges row: Category, Sentiment, Impact */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        <Badge variant="primary">{item.category}</Badge>
        <Badge sentiment={sentiment.sentiment}>{sentiment.text}</Badge>
        <Badge variant={impact.variant}>Impact: {impact.name} ({item.impact_score})</Badge>
      </div>

      {/* Mapped Tickers */}
      {item.symbols && item.symbols.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>Affected Stocks:</span>
          {item.symbols.map((sym) => (
            <span
              key={sym}
              onClick={() => onSymbolClick?.(sym)}
              style={{
                fontSize: "11px",
                fontWeight: "750",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "var(--accent-green)",
                borderRadius: "4px",
                padding: "2px 6px",
                cursor: onSymbolClick ? "pointer" : "default",
                transition: "all 0.2s"
              }}
              className="news-ticker-tag"
            >
              {sym}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary Box */}
      <div 
        style={{ 
          background: "rgba(128, 128, 128, 0.03)", 
          border: "1px solid var(--border)", 
          borderLeft: "3px solid var(--accent-green)",
          borderRadius: "6px", 
          padding: "10px 12px",
          marginTop: "10px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "750", color: "var(--accent-green)", marginBottom: "4px", textTransform: "uppercase" }}>
          <Sparkles size={12} />
          <span>AI Summary</span>
        </div>
        <p style={{ margin: 0, fontSize: "12.5px", lineHeight: "1.5", color: "var(--text-secondary)" }}>
          {item.summary}
        </p>
      </div>
    </Card>
  );
};

export default NewsCard;
