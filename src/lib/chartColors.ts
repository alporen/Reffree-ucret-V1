import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * dataviz yöntemiyle seçildi: sabit sıralı kategorik palet.
 * Sırayı değiştirmeyin; sıra CVD güvenliğinin mekanizmasıdır.
 * Koyu yüzey #111f2e (--panel) ve açık yüzey #ffffff üzerinde
 * lightness band, chroma, CVD ΔE≥8 adjacent, normal-vision ΔE≥15 ve
 * ≥3:1 kontrast kontrollerini geçen adımlar.
 */
export const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];
export const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

export function categoricalFor(tema: 'koyu' | 'acik') {
  return tema === 'koyu' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

interface ChartChrome {
  tema: 'koyu' | 'acik';
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  border2: string;
  brand: string;
  grid: string;
  series: string[];
}

const CHROME: Record<'koyu' | 'acik', Omit<ChartChrome, 'tema' | 'series'>> = {
  koyu: {
    surface: '#111f2e',
    surface2: '#16273a',
    text: '#e7edf3',
    muted: '#8ba3b8',
    border: '#1f3247',
    border2: '#2a405a',
    brand: '#2bd97b',
    grid: '#1f3247',
  },
  acik: {
    surface: '#ffffff',
    surface2: '#f4f7fb',
    text: '#14232f',
    muted: '#5c7286',
    border: '#dfe6ee',
    border2: '#c9d6e2',
    brand: '#12a95c',
    grid: '#e4eaf0',
  },
};

/** Grafik chrome'u — src/index.css içindeki tema değişkenleriyle birebir aynı değerler. */
export function useChartChrome(): ChartChrome {
  const { tema } = useTheme();
  return useMemo(() => ({ tema, ...CHROME[tema], series: categoricalFor(tema) }), [tema]);
}
