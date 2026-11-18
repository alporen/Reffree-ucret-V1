import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { tl } from '../lib/format';

export default function KazanclarChart({ data }: { data: { key: string; ay: string; toplam: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" tickFormatter={(v) => `${Math.round(Number(v) / 1000)} B`} stroke="#8ba3b8" fontSize={11} />
        <YAxis type="category" dataKey="ay" width={90} stroke="#8ba3b8" fontSize={11} />
        <Tooltip formatter={(v) => tl(Number(v))} />
        <Bar dataKey="toplam" name="Toplam" fill="#2bd97b" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
