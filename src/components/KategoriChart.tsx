import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2bd97b', '#3ea7ff', '#e0a943', '#ff6b5e', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'];

export default function KategoriChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [`${v} maç`, n]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
