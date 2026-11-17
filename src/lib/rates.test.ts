import { describe, expect, it } from 'vitest';
import {
  computeHarcirah,
  computeMatchTotals,
  resolveTravelFee,
  type RateCategory,
} from './rates';

const PAF: RateCategory = { id: 1, key: 'paf_u19', label: 'PAF U19', referee: 2200, assistant: 1300, fourth: 1040 };
const FUTSAL_IL: RateCategory = { id: 25, key: 'futsal_il', label: 'Futsal İl', referee: 650, assistant: 450, fourth: 0 };

describe('computeHarcirah', () => {
  it('ev sahibi / ikamet ilçesinde ücretin %25’i', () => {
    expect(computeHarcirah(2200, 'home', false)).toBe(550);
  });
  it('deplasmanda ücretin %50’si', () => {
    expect(computeHarcirah(2200, 'away', false)).toBe(1100);
  });
  it('2. maç (aynı gün aynı yer) seçilirse 0', () => {
    expect(computeHarcirah(2200, 'home', true)).toBe(0);
    expect(computeHarcirah(1300, 'away', true)).toBe(0);
  });
  it('çeyrek kuruşa yuvarlar (ör. 1620 × %25)', () => {
    expect(computeHarcirah(1620, 'home', false)).toBe(405);
    expect(computeHarcirah(1165, 'home', false)).toBe(291.25);
    expect(computeHarcirah(1165, 'away', false)).toBe(582.5);
  });
});

describe('computeMatchTotals', () => {
  it('PAF U19 Hakem · deplasman · 21–50 km → 2552 + yol', () => {
    expect(computeMatchTotals(PAF, 'referee', 'away', 550, false)).toEqual({
      matchFee: 2200,
      harcirah: 1100,
      travelFee: 550,
      total: 3850,
    });
  });
  it('PAF U19 Hakem · ev sahibi · 0–20 km → 2200 + 550 + 460 = 3.210', () => {
    expect(computeMatchTotals(PAF, 'referee', 'home', 460, false).total).toBe(3210);
  });
  it('U14 Hakem · deplasman · 76–100 km: %50 harcırah (520) → 1040 + 520 + 830 = 2.390', () => {
    const u14: RateCategory = { ...PAF, id: 20, key: 'u14', label: 'U14', referee: 1040, assistant: 650, fourth: 520 };
    const r = computeMatchTotals(u14, 'referee', 'away', 830, false);
    expect([r.matchFee, r.harcirah, r.total]).toEqual([1040, 520, 2390]);
  });
  it('2. maç: yol ve harcırah sıfırlanır, maç ücreti ödenir', () => {
    const r = computeMatchTotals(PAF, 'assistant', 'away', 550, true);
    expect([r.harcirah, r.travelFee]).toEqual([0, 0]);
    expect(r.total).toBe(1300);
  });
  it('Futsal İl 4. Hakem → ücret 0, toplam road/harcıraha indirgenmez', () => {
    const r = computeMatchTotals(FUTSAL_IL, 'fourth', 'home', 0, false);
    expect(r.matchFee).toBe(0);
    expect(r.harcirah).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe('resolveTravelFee', () => {
  it('"yok" seçilirse 0', () => {
    expect(resolveTravelFee(null)).toBe(0);
  });
  it('bant seçilirse bandın ücreti', () => {
    expect(resolveTravelFee({ fee: 1382 })).toBe(1382);
  });
});
