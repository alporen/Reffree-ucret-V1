import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarDays, CircleDollarSign, Trophy } from 'lucide-react';
import { readMatches } from '../lib/matches';
import { useAuth } from '../context/AuthContext';
import { monthName, tl } from '../lib/format';
import { ROLE_LABELS } from '../lib/rates';
import { DUR } from '../lib/motion';

export default function DashboardPage() {
  const { profile, configError } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof readMatches>>['data']>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    readMatches().then(({ data, error }) => {
      if (error) setHata(error);
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const toplam = matches.reduce((a, m) => a + m.total, 0);
    const ort = matches.length ? toplam / matches.length : 0;
    const byCat = new Map<string, number>();
    for (const m of matches) byCat.set(m.category_label, (byCat.get(m.category_label) ?? 0) + 1);
    const [enSikAdi, enSikAdet] = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
    const yuzde = matches.length ? Math.round((enSikAdet / matches.length) * 100) : 0;

    const now = new Date();
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const buAy = matches.filter((m) => m.match_date.startsWith(thisKey));

    const topMatches = matches.filter((m) => m.category_label === enSikAdi).slice(0, 8);

    return { toplam, ort, enSikAdi, enSikAdet, yuzde, buAy, thisKey, topMatches, now };
  }, [matches]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">GENEL BAKIŞ</div>
          <h1 className="mt-1 text-2xl font-bold">Ana Sayfa</h1>
        </div>
        <div className="chip">
          <span>Genel toplam kazanç</span>
          <span className="text-base font-bold text-[var(--green)]">{tl(stats.toplam)}</span>
        </div>
      </div>

      {configError && (
        <div className="panel mt-4 flex items-start gap-3 border-[var(--gold)] p-4 text-xs text-[var(--gold)]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{configError}</span>
        </div>
      )}
      {hata && !configError && (
        <div className="panel mt-4 border-[var(--red)] p-4 text-xs text-[var(--red)]">{hata}</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: 'Bu ay yapılan maç', value: `${loading ? '…' : stats.buAy.length} maç`, sub: `${monthName(stats.now.getMonth())} ${stats.now.getFullYear()}`, color: 'var(--blue)' },
          { icon: CircleDollarSign, label: 'Ortalama maç başı kazanç', value: loading ? '…' : tl(stats.ort), sub: 'Girilen tüm maçların ortalaması', color: 'var(--green)' },
          { icon: Trophy, label: 'En sık çıktığınız tür', value: loading ? '…' : stats.enSikAdi, sub: matches.length ? `${stats.yuzde}% · ${stats.enSikAdet} maç` : 'Henüz maç yok', color: 'var(--gold)' },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            className="panel flex items-center gap-4 p-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-xl border p-3" style={{ color: c.color, borderColor: c.color }}>
              <c.icon size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--muted)]">{c.label}</div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-[11px] text-[var(--muted-2)]">{c.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.section
        className="panel mt-6 overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
          <div>
            <h2 className="font-semibold">En çok çıktığınız kategoride maçlar</h2>
            <p className="text-xs text-[var(--muted)]">{stats.enSikAdi} kategorisindeki maçlarınız</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip">{stats.topMatches.length} maç</span>
            <button onClick={() => navigate('/mac-ekle')} className="btn-primary py-2 text-sm">+ Maç ekle</button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">Yükleniyor…</div>
        ) : stats.topMatches.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[var(--muted)]">Henüz maç eklenmediniz.</p>
            <Link to="/mac-ekle" className="btn-primary mt-4 inline-flex">İlk maçı ekleyin</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr><th className="px-5 py-3">Tarih</th><th className="px-5 py-3">Maç türü</th><th className="px-5 py-3">Görevi</th></tr>
            </thead>
            <tbody>
              {stats.topMatches.map((m) => (
                <tr key={m.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-3 font-semibold">{new Date(m.match_date + 'T00:00:00').toLocaleDateString('tr-TR')}</td>
                  <td className="px-5 py-3">{m.category_label}</td>
                  <td className="px-5 py-3">{ROLE_LABELS[m.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.section>

      {profile?.username && <div className="no-print mt-4 text-right text-xs text-[var(--muted-2)]">@{profile.username}</div>}
    </div>
  );
}
