import React, { useEffect, useState } from "react";
import { newsService } from "../../features/news/news.service";
import type { NewsItem } from "../../features/news/types";
import NewsCard from "../../features/news/NewsCard";
import Loader from "../../components/ui/Loader";
import { Search, Sparkles, Filter } from "lucide-react";

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sentimentFilter, setSentimentFilter] = useState<string>("All");
  const [impactFilter, setImpactFilter] = useState<string>("All");

  const categories = ["All", "Market", "Company", "Economy", "Global", "Sector", "Earnings"];

  useEffect(() => {
    newsService.getNews().then((data) => {
      setNews(data);
      setLoading(false);
    });
  }, []);

  // Filter News Logic
  const filteredNews = news.filter((item) => {
    // 1. Search Query
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.symbols && item.symbols.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    // 2. Category
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;

    // 3. Sentiment
    let matchesSentiment = true;
    if (sentimentFilter !== "All") {
      const isBullish = item.sentiment_score > 60;
      const isBearish = item.sentiment_score < 40;
      const isNeutral = item.sentiment_score >= 40 && item.sentiment_score <= 60;

      if (sentimentFilter === "Bullish") matchesSentiment = isBullish;
      else if (sentimentFilter === "Bearish") matchesSentiment = isBearish;
      else if (sentimentFilter === "Neutral") matchesSentiment = isNeutral;
    }

    // 4. Impact
    let matchesImpact = true;
    if (impactFilter !== "All") {
      const score = item.impact_score;
      if (impactFilter === "Low") matchesImpact = score < 30;
      else if (impactFilter === "Medium") matchesImpact = score >= 30 && score < 60;
      else if (impactFilter === "High") matchesImpact = score >= 60 && score < 80;
      else if (impactFilter === "Extreme") matchesImpact = score >= 80;
    }

    return matchesSearch && matchesCategory && matchesSentiment && matchesImpact;
  });

  return (
    <div className="news-page-container" style={{ padding: "2rem" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            News Intelligence <Sparkles size={20} style={{ color: "var(--accent-green)" }} />
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
            AI-summarized financial news mapping sentiment impact across equities.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search news or symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px 8px 36px",
              background: "rgba(128,128,128,0.06)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13.5px",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div 
        className="news-category-tabs" 
        style={{ 
          display: "flex", 
          gap: "8px", 
          overflowX: "auto", 
          paddingBottom: "10px", 
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border)"
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: activeCategory === cat ? "var(--accent-green)" : "var(--border)",
              background: activeCategory === cat ? "rgba(16, 185, 129, 0.08)" : "transparent",
              color: activeCategory === cat ? "var(--accent-green)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dropdown Filters Row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
          <Filter size={14} /> Filter:
        </span>

        {/* Sentiment Select */}
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "rgba(128,128,128,0.06)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-primary)",
            fontSize: "12.5px",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="All">All Sentiments</option>
          <option value="Bullish">Bullish</option>
          <option value="Neutral">Neutral</option>
          <option value="Bearish">Bearish</option>
        </select>

        {/* Impact Select */}
        <select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            background: "rgba(128,128,128,0.06)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-primary)",
            fontSize: "12.5px",
            outline: "none",
            cursor: "pointer"
          }}
        >
          <option value="All">All Impacts</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Extreme">Extreme</option>
        </select>
      </div>

      {/* News Grid Loader / List */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <Loader type="card" count={3} height="220px" />
        </div>
      ) : filteredNews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
          <p style={{ margin: 0, fontSize: "15px" }}>No matching news reports found.</p>
        </div>
      ) : (
        <div className="news-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default News;
