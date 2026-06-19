export interface SectorStrength {
  id: string;
  sector: string;
  strength_score: number;
  trend: 'up' | 'down' | 'flat';
  updated_at: string;
}
