export interface ActivityFeedItem {
  id: string;
  type: 'Signal' | 'News' | 'Sector' | 'Regime';
  message: string;
  metadata?: any;
  created_at: string;
}
