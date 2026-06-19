export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: 'Market' | 'Company' | 'Economy' | 'Global' | 'Sector' | 'Earnings';
  summary: string;
  sentiment_score: number; // 0 to 100
  impact_score: number; // 0 to 100
  published_at: string;
  created_at?: string;
  symbols?: string[]; // Mapped stock symbols
}

export interface NewsStockMapping {
  id: string;
  news_id: string;
  symbol: string;
}
