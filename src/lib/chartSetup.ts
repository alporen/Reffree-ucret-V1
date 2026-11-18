import {
  Chart,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Yalnız kullanılan parçaları kaydet (tree-shaking dostu)
Chart.register(
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

export { Chart };
