import { supabase } from "../../services/supabase";
import type { NewsItem } from "./types";

// High-fidelity local mock data matching SQL seeds
const mockNewsItems: NewsItem[] = [
  {
    id: 'a123e456-789b-12d3-a456-426614174000',
    title: 'RBI holds repo rate unchanged at 6.5%, maintains focus on inflation targets',
    source: 'Financial Times',
    category: 'Economy',
    summary: 'The Reserve Bank of India has decided to maintain the policy repo rate at 6.5% for the eighth consecutive time. The decision is in line with expectations to keep inflation within check while supporting balanced GDP growth.',
    sentiment_score: 52, // Neutral-ish
    impact_score: 74, // High
    published_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    symbols: ['BANKNIFTY', 'HDFCBANK']
  },
  {
    id: 'b123e456-789b-12d3-a456-426614174001',
    title: 'TCS signs strategic cloud migration partnership with European retail conglomerate',
    source: 'Bloomberg',
    category: 'Company',
    summary: 'Tata Consultancy Services announced a multi-year deal worth $450M to migrate legacy infrastructure to hybrid cloud environments. This is expected to improve enterprise revenue growth and margin visibility over the long term.',
    sentiment_score: 88, // Positive
    impact_score: 85, // High
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    symbols: ['TCS']
  },
  {
    id: 'g123e456-789b-12d3-a456-426614174006',
    title: 'Infosys partners with Nvidia to deploy generative AI solutions globally',
    source: 'Mint',
    category: 'Company',
    summary: 'Infosys will build custom LLM-based enterprise workflows for global manufacturing clients. This elevates competitive footing in IT consultancy AI segments.',
    sentiment_score: 82, // Positive
    impact_score: 81, // High
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    symbols: ['INFY']
  },
  {
    id: 'c123e456-789b-12d3-a456-426614174002',
    title: 'US tech indices rally as federal inflation prints at 3.1%, beating estimates',
    source: 'Reuters',
    category: 'Global',
    summary: 'Nasdaq composite rose 1.8% in pre-market trade following lower-than-expected CPI prints. Investors expect interest rate cuts by the Federal Reserve to commence sooner, boosting global tech valuations.',
    sentiment_score: 85, // Positive
    impact_score: 78, // High
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    symbols: ['TCS', 'INFY']
  },
  {
    id: 'd123e456-789b-12d3-a456-426614174003',
    title: 'Auto sector expects sales expansion following premium model demand spikes',
    source: 'Economic Times',
    category: 'Sector',
    summary: 'Passenger vehicle exports saw a 12% rise in May. High-end SUV segments continue to drive margins higher, offsetting flat volumes in entry-level sedan categories.',
    sentiment_score: 78, // Positive
    impact_score: 65, // Medium
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    symbols: ['RELIANCE']
  },
  {
    id: 'e123e456-789b-12d3-a456-426614174004',
    title: 'Reliance Industries acquires premium retail licensing rights for global luxury brands',
    source: 'CNBC',
    category: 'Company',
    summary: 'Reliance Retail has announced the acquisition of rights to operate key luxury designer boutiques in prime metropolitan locations, expanding its premium fashion segment market share.',
    sentiment_score: 82, // Positive
    impact_score: 80, // High
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    symbols: ['RELIANCE']
  },
  {
    id: 'f123e456-789b-12d3-a456-426614174005',
    title: 'Metal index trades down following slow real estate expansion metrics in China',
    source: 'Reuters',
    category: 'Global',
    summary: 'Steel and aluminum contracts dipped 2.3% as property demand indexes drop. Steel output continues to face near-term headwinds from excess supply concerns.',
    sentiment_score: 25, // Negative
    impact_score: 42, // Medium
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    symbols: []
  }
];

export const newsService = {
  /**
   * Fetch all news, with optional database filters.
   * If tables don't exist, resolves with mock data.
   */
  async getNews(): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from("news")
        .select(`
          id,
          title,
          source,
          category,
          summary,
          sentiment_score,
          impact_score,
          published_at,
          created_at,
          news_stock_mapping(symbol)
        `)
        .order("published_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Map news_stock_mapping response to symbols string array
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          source: item.source,
          category: item.category,
          summary: item.summary,
          sentiment_score: item.sentiment_score,
          impact_score: item.impact_score,
          published_at: item.published_at,
          created_at: item.created_at,
          symbols: item.news_stock_mapping ? item.news_stock_mapping.map((m: any) => m.symbol) : []
        }));
      }

      return mockNewsItems;
    } catch (err) {
      console.warn("Supabase news query failed; utilizing mock data fallback.", err);
      // Sort mock items in descending order of published_at
      return [...mockNewsItems].sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    }
  },

  /**
   * Fetch breaking news specifically for the scrolling ticker.
   */
  async getBreakingNews(): Promise<NewsItem[]> {
    const news = await this.getNews();
    // Filter items with high impact/sentiment shifts or just take top 4
    return news.filter(n => n.impact_score >= 60).slice(0, 5);
  }
};
