/** Ücret mantığı — saf fonksiyonlar. Supabase / React bağımsız. */

export type Role = 'referee' | 'assistant' | 'fourth';
export type Venue = 'home' | 'away';

export interface RateCategory {
  id: number;
  key: string;
  label: string;
  referee: number;
  assistant: number;
  fourth: number;
}

export interface TravelBand {
  id: number;
  code: string;
  label: string;
  min_km: number | null;
  max_km: number | null;
  fee: number;
}

/** Kuruş hassasiyetli yuvarlama (₺1.745,50 gibi). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function matchFeeFor(category: Pick<RateCategory, Role>, role: Role): number {
  return category[role];
}

/** Ev sahibi/ikamet %25, deplasman %50; 2. maç → 0. */
export function computeHarcirah(matchFee: number, venue: Venue, secondSameDay: boolean): number {
  if (secondSameDay) return 0;
  const rate = venue === 'home' ? 0.25 : 0.5;
  return round2(matchFee * rate);
}

export function resolveTravelFee(band: Pick<TravelBand, 'fee'> | null): number {
  return band ? band.fee : 0;
}

export interface MatchTotals {
  matchFee: number;
  harcirah: number;
  travelFee: number;
  total: number;
}

export function computeMatchTotals(
  category: RateCategory,
  role: Role,
  venue: Venue,
  travelFee: number,
  secondSameDay: boolean,
): MatchTotals {
  const matchFee = matchFeeFor(category, role);
  const harcirah = computeHarcirah(matchFee, venue, secondSameDay);
  const travel = secondSameDay ? 0 : round2(travelFee);
  return { matchFee, harcirah, travelFee: travel, total: round2(matchFee + harcirah + travel) };
}

export const ROLE_LABELS: Record<Role, string> = {
  referee: 'Hakem',
  assistant: 'Yardımcı Hakem',
  fourth: '4. Hakem',
};

export const VENUE_LABELS: Record<Venue, string> = {
  home: 'Ev sahibi / ikamet ilçesi (%25)',
  away: 'Deplasman (%50)',
};
