import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { activityService } from "./activity.service";
import type { ActivityFeedItem } from "./types";
import { Sparkles, Radio, Newspaper, Flame, Layers } from "lucide-react";
import Loader from "../../components/ui/Loader";

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.getActivityFeed().then((data) => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const getActivityStyle = (type: string) => {
    switch (type) {
      case "Signal":
        return { color: "var(--accent-purple)", icon: Radio, bg: "rgba(170, 59, 255, 0.08)" };
      case "News":
        return { color: "var(--accent-blue)", icon: Newspaper, bg: "rgba(59, 130, 246, 0.08)" };
      case "Sector":
        return { color: "var(--accent-green)", icon: Layers, bg: "rgba(16, 185, 129, 0.08)" };
      case "Regime":
        return { color: "var(--accent-yellow)", icon: Flame, bg: "rgba(245, 158, 11, 0.08)" };
      default:
        return { color: "var(--text-secondary)", icon: Sparkles, bg: "rgba(156, 163, 175, 0.08)" };
    }
  };

  const formatShortTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "00:00";
    }
  };

  if (loading) {
    return (
      <Card title="AI Activity Feed" subtitle="System Logs" extra={<Sparkles size={18} />}>
        <Loader type="line" count={4} height="36px" style={{ marginBottom: "10px" }} />
      </Card>
    );
  }

  return (
    <Card 
      title="AI Activity Feed" 
      subtitle="Real-time model & market updates" 
      extra={<Sparkles size={18} style={{ color: "var(--accent-green)" }} />}
    >
      <div className="activity-feed-timeline-container" style={{ position: "relative", paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
        {/* Vertical track line */}
        <div 
          className="timeline-track-line"
          style={{
            position: "absolute",
            left: "5px",
            top: "8px",
            bottom: "8px",
            width: "2px",
            background: "var(--border)"
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activities.map((act) => {
            const style = getActivityStyle(act.type);
            const Icon = style.icon;

            return (
              <div 
                key={act.id} 
                className="activity-feed-item-row"
                style={{ 
                  position: "relative",
                  display: "flex", 
                  gap: "12px", 
                  alignItems: "flex-start",
                  transition: "all 0.2s"
                }}
              >
                {/* Timeline Dot with Icon */}
                <div 
                  className="timeline-dot-wrapper"
                  style={{
                    position: "absolute",
                    left: "-25px",
                    top: "3px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "var(--bg-card)",
                    border: `2px solid ${style.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    boxShadow: "0 0 8px rgba(0,0,0,0.5)"
                  }}
                  title={act.type}
                >
                  <Icon size={10} style={{ color: style.color }} />
                </div>

                {/* Content block */}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span 
                      style={{ 
                        fontSize: "11px", 
                        fontWeight: "750", 
                        color: style.color, 
                        background: style.bg,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase"
                      }}
                    >
                      {act.type}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      {formatShortTime(act.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4", color: "var(--text-primary)" }}>
                    {act.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ActivityFeed;
