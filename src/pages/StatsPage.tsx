import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { readMatches } from '../lib/matches';
import { monthName, tl } from '../lib/format';
import type { MatchRow } from '../lib/types';

const COLORS = ['#2bd97b', '#3ea7ff', '#e0a943', '#ff6b5e', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'];

const KazanclarChart = lazy(() => import('../components/KazanclarChart'));
const KategoriChart = lazy(() => import('../components/KategoriChart'));

export default function StatsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    readMatches().then(({ data, error }) => {
      if (error) setHata(error);
      setMatches(data);
      setLoading(false);
    });
  }, [session]);

  const aylikVeri = useMemo(() => {
    const map = new Map<string, { key: string; ay: string; toplam: number }>();
    for (const m of matches) {
      const key = m.match_date.slice(0, 7);
      const [y, mo] = key.split('-').map(Number);
      const existing = map.get(key);
      if (existing) existing.toplam += m.total;
      else map.set(key, { key, ay: `${monthName(mo - 1)} ${y}`, toplam: m.total });
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [matches]);

  const kategoriVeri = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of matches) map.set(m.category_label, (map.get(m.category_label) ?? 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [matches]);

  const genelToplam = useMemo(() => matches.reduce((a, m) => a + m.total, 0), [matches]);

  if (!session) {
    return (
      <div className="panel mx-auto mt-6 max-w-xl p-8 text-center">
        <h2 className="text-lg font-semibold">Oturum açmanız gerekiyor</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">İstatistikleri görmek için giriş yapın.</p>
        <button onClick={() => navigate('/giris')} className="btn-primary mt-5">Giriş yap</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">İSTATİSTİKLER</div>
          <h1 className="mt-1 text-2xl font-bold">İstatistikler</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Kazançlarınızı ve yönettiğiniz maç kategorilerini inceleyin.</p>
        </div>
        <div className="chip">
          <span>Genel toplam kazanç</span>
          <span className="text-base font-bold text-[var(--green)]">{tl(genelToplam)}</span>
        </div>
      </div>

      {hata && <div className="panel mt-4 border-[var(--red)] p-4 text-xs text-[var(--red)]">{hata}</div>}

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">Yükleniyor…</div>
      ) : matches.length === 0 ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="text-sm text-[var(--muted)]">Grafikleri görmek için en az bir maç ekleyin.</p>
          <button onClick={() => navigate('/mac-ekle')} className="btn-primary mt-4">Maç ekle</button>
        </div>
      ) : (
        <>
          <section className="panel mt-6 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Kazançlar</h2>
                <p className="text-xs text-[var(--muted)]">Ay bazında maç ücreti, yol ve harcırah toplamı</p>
              </div>
              <span className="chip">{aylikVeri.length} ay</span>
            </div>
            <div className="mt-4 h-64">
              <Suspense fallback={<div className="h-full text-center text-sm text-[var(--muted)]">Grafik yükleniyor…</div>}>
                <KazanclarChart data={aylikVeri} />
              </Suspense>
            </div>
          </section>

          <section className="panel mt-6 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Çıkılan maç kategorileri</h2>
                <p className="text-xs text-[var(--muted)]">Yönettiğiniz maçların kategoriye göre dağılımı</p>
              </div>
              <span className="chip">{matches.length} maç</span>
            </div>
            <div className="mt-4 grid items-center gap-4 md:grid-cols-2">
              <div className="h-64">
                <Suspense fallback={<div className="h-full text-center text-sm text-[var(--muted)]">Grafik yükleniyor…</div>}>
                  <KategoriChart data={kategoriVeri} />
                </Suspense>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  <tr><th className="py-2">Maç kategorisi</th><th className="py-2 text-right">Adet</th><th className="py-2 text-right">Yüzde</th></tr>
                </thead>
                <tbody>
                  {kategoriVeri.map((k, i) => (
                    <tr key={k.name} className="border-t border-[var(--border)]">
                      <td className="py-2 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {k.name}
                      </td>
                      <td className="py-2 text-right">{k.value}</td>
                      <td className="py-2 text-right text-[var(--muted)]">{Math.round((k.value / matches.length) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
