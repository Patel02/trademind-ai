import React, { useEffect, useState } from "react";
import { newsService } from "./news.service";
import type { NewsItem } from "./types";
import { Zap } from "lucide-react";

export const BreakingBanner: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchBreakingNews = () => {
      newsService.getBreakingNews().then((data) => {
        setNews(data);
      });
    };

    fetchBreakingNews();

    // Auto-refresh breaking news in the background every 15 minutes
    const intervalId = setInterval(fetchBreakingNews, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="breaking-banner-wrapper">
      {/* Flashing Breaking Indicator */}
      <div className="breaking-label">
        <Zap size={13} className="breaking-icon" />
        <span>BREAKING</span>
      </div>

      {/* Scrolling Container */}
      <div className="breaking-marquee-container">
        <div className="breaking-marquee-content">
          {news.map((item) => (
            <span key={item.id} className="breaking-news-item">
              <span className="breaking-item-dot">•</span>
              <span className="breaking-item-category">[{item.category}]</span>
              <span className="breaking-item-title">{item.title}</span>
              <span 
                className="breaking-item-impact" 
                style={{
                  color: item.impact_score > 80 ? "var(--accent-red)" : item.impact_score > 50 ? "var(--accent-yellow)" : "var(--accent-blue)"
                }}
              >
                (Impact: {item.impact_score})
              </span>
            </span>
          ))}
          {/* Duplicate list for infinite loop */}
          {news.map((item) => (
            <span key={`dup-${item.id}`} className="breaking-news-item">
              <span className="breaking-item-dot">•</span>
              <span className="breaking-item-category">[{item.category}]</span>
              <span className="breaking-item-title">{item.title}</span>
              <span 
                className="breaking-item-impact" 
                style={{
                  color: item.impact_score > 80 ? "var(--accent-red)" : item.impact_score > 50 ? "var(--accent-yellow)" : "var(--accent-blue)"
                }}
              >
                (Impact: {item.impact_score})
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BreakingBanner;
