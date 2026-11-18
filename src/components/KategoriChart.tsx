import { useEffect, useRef } from 'react';
import '../lib/chartSetup';
import { Chart } from '../lib/chartSetup';
import { useChartChrome } from '../lib/chartColors';

export default function KategoriChart({ data }: { data: { name: string; value: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const chrome = useChartChrome();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();

    // En fazla 8 dilim; sıra doğrulanmış kategorik sıraya göre (renk kayması olmaz).
    const labels = data.map((d) => d.name);
    const values = data.map((d) => d.value);
    const colors = data.map((_, i) => chrome.series[i % chrome.series.length]);

    chartRef.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label: 'Maç sayısı',
            data: values,
            backgroundColor: colors,
            hoverOffset: 8,
            borderColor: chrome.surface,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        animation: { duration: 400, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false }, // yanındaki tablo kategorileri adlarıyla listeliyor (çift kodlama)
          tooltip: {
            backgroundColor: chrome.surface2,
            titleColor: chrome.text,
            bodyColor: chrome.text,
            borderColor: chrome.border2,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const v = Number(ctx.parsed);
                return ` ${v} maç · %${Math.round((v / total) * 100)}`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), chrome.tema]);

  return <canvas ref={canvasRef} role="img" aria-label="Maç kategorisi dağılımı grafiği" />;
}
