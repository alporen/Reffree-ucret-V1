import { useEffect, useRef } from 'react';
import '../lib/chartSetup';
import { Chart } from '../lib/chartSetup';
import { useChartChrome } from '../lib/chartColors';
import { tl } from '../lib/format';

export default function KazanclarChart({ data }: { data: { key: string; ay: string; toplam: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const chrome = useChartChrome();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();

    // Tek seri (aylık toplam kazanç) — legend gereksiz, başlık adı seriyi belirtir.
    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.ay),
        datasets: [
          {
            label: 'Aylık toplam kazanç',
            data: data.map((d) => d.toplam),
            backgroundColor: chrome.brand,
            hoverBackgroundColor: chrome.brand,
            borderRadius: 8,
            borderSkipped: 'start',
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        layout: { padding: { right: 8 } },
        scales: {
          x: {
            grid: { color: chrome.grid, drawTicks: false },
            border: { display: false },
            ticks: {
              color: chrome.muted,
              callback: (v) => `${Math.round(Number(v) / 1000)} B`,
            },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: chrome.text },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: chrome.surface2,
            titleColor: chrome.text,
            bodyColor: chrome.text,
            borderColor: chrome.border2,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => tl(Number(ctx.parsed.x)),
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

  return <canvas ref={canvasRef} role="img" aria-label="Ay bazında toplam kazanç grafiği" />;
}
