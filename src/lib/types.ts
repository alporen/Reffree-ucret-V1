import type { Role, Venue } from './rates';

export interface Season {
  id: number;
  label: string;
}

export type { Role, Venue };

export interface MatchRow {
  id: string;
  match_date: string;         // YYYY-MM-DD
  role: Role;
  venue: Venue;
  second_same_day: boolean;
  season_id: number;
  category_id: number;
  category_label: string;     // join'den gelir
  match_fee: number;
  harcirah: number;
  travel_fee: number;
  travel_band_id: number | null;
  total: number;              // match_fee + harcirah + travel_fee
  created_at: string;
}

/** Ay başlıkları için: YYYY-MM → { yıl, ay } */
export interface MonthBucket {
  key: string;                // '2026-11'
  year: number;
  month: number;              // 1-12
  count: number;
  total: number;
  matches: MatchRow[];
}
