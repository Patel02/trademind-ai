import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { radarService } from "./radar.service";
import type { SectorStrength } from "./types";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import Loader from "../../components/ui/Loader";

export const MarketRadar: React.FC = () => {
  const [sectors, setSectors] = useState<SectorStrength[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    radarService.getSectorStrengths().then((data) => {
      setSectors(data);
      setLoading(false);
    });
  }, []);

  const getHeatmapClass = (score: number) => {
    if (score >= 80) return "sector-strong";
    if (score >= 60) return "sector-neutral";
    return "sector-weak";
  };

  if (loading) {
    return (
      <Card title="Market Radar" subtitle="Sector Strength Heatmap" extra={<Flame size={18} />}>
        <Loader type="line" count={4} height="30px" style={{ marginBottom: "10px" }} />
      </Card>
    );
  }

  return (
    <Card 
      title="Market Radar" 
      subtitle="Sector Inflow & Strength Heatmap" 
      extra={<Flame size={18} style={{ color: "var(--accent-red)" }} />}
    >
      <div className="market-radar-heatmap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginTop: "0.5rem" }}>
        {sectors.map((sec) => {
          const heatClass = getHeatmapClass(sec.strength_score);
          const isUp = sec.trend === "up";
          const isDown = sec.trend === "down";

          return (
            <div 
              key={sec.id} 
              className={`sector-heatmap-block ${heatClass}`}
              style={{
                borderRadius: "10px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "90px",
                transition: "all 0.25s ease",
                cursor: "default"
              }}
            >
              {/* Header: Name & Arrow */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "750", lineHeight: "1.2" }} className="sector-title">
                  {sec.sector}
                </span>
                <span className="sector-trend-icon">
                  {isUp && <TrendingUp size={14} />}
                  {isDown && <TrendingDown size={14} />}
                  {!isUp && !isDown && <span style={{ fontSize: "12px", fontWeight: "700" }}>=</span>}
                </span>
              </div>

              {/* Footer: Strength Rating */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "600", opacity: 0.7 }}>
                  Strength
                </span>
                <strong style={{ fontSize: "28px", fontWeight: "850", lineHeight: "1" }} className="sector-score">
                  {sec.strength_score}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MarketRadar;
