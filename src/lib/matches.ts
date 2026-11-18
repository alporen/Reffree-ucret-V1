/** Maç verisi erişim katmanı — Supabase sorguları. */
import { supabase, supabaseConfigured } from './supabase';
import type { MatchRow, MonthBucket, Season } from './types';
import type { Role, Venue } from './rates';

export interface MatchInput {
  match_date: string;
  category_id: number;
  season_id: number;
  role: Role;
  venue: Venue;
  second_same_day: boolean;
  travel_band_id: number | null;
  travel_fee: number;
  harcirah: number;
  match_fee: number;
}

export async function readSeasons(): Promise<{ data: Season[]; error: string | null }> {
  if (!supabaseConfigured) return { data: [], error: 'Supabase yapılandırılmamış.' };
  const { data, error } = await supabase.from('seasons').select('id, label').order('label', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Season[], error: null };
}

export async function readCategories(seasonId: number) {
  const { data, error } = await supabase
    .from('fee_categories')
    .select('id, key, label, referee, assistant, fourth, sort_order')
    .eq('season_id', seasonId)
    .order('sort_order', { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function readTravelBands(seasonId: number) {
  const { data, error } = await supabase
    .from('travel_bands')
    .select('id, code, label, min_km, max_km, fee')
    .eq('season_id', seasonId)
    .order('min_km', { ascending: true, nullsFirst: false });
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function readMatches(seasonId?: number): Promise<{ data: MatchRow[]; error: string | null }> {
  if (!supabaseConfigured) return { data: [], error: 'Supabase yapılandırılmamış.' };
  let q = supabase
    .from('matches')
    .select('id, match_date, role, venue, second_same_day, season_id, category_id, match_fee, harcirah, travel_fee, travel_band_id, created_at, fee_categories!inner(label)')
    .order('match_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (seasonId) q = q.eq('season_id', seasonId);
  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  const rows: MatchRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    match_date: r.match_date,
    role: r.role,
    venue: r.venue,
    second_same_day: r.second_same_day,
    season_id: r.season_id,
    category_id: r.category_id,
    category_label: r.fee_categories?.label ?? '',
    match_fee: Number(r.match_fee),
    harcirah: Number(r.harcirah),
    travel_fee: Number(r.travel_fee),
    travel_band_id: r.travel_band_id,
    total: Number(r.match_fee) + Number(r.harcirah) + Number(r.travel_fee),
    created_at: r.created_at,
  }));
  return { data: rows, error: null };
}

export async function insertMatch(input: MatchInput) {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return { error: authError?.message ?? 'Oturum bulunamadı. Tekrar giriş yapın.' };
  const { error } = await supabase.from('matches').insert({ ...input, user_id: userData.user.id });
  return { error: error ? error.message : null };
}

export async function updateMatch(id: string, input: MatchInput) {
  const { error } = await supabase.from('matches').update(input).eq('id', id);
  return { error: error ? error.message : null };
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export function groupMatchesByMonth(rows: MatchRow[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>();
  for (const r of rows) {
    const key = r.match_date.slice(0, 7);
    const [y, m] = key.split('-').map(Number);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { key, year: y, month: m, count: 0, total: 0, matches: [] };
      map.set(key, bucket);
    }
    bucket.count += 1;
    bucket.total += r.total;
    bucket.matches.push(r);
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}
