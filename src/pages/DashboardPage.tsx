import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CircleDollarSign, Trophy } from 'lucide-react';
import { readMatches } from '../lib/matches';
import { useAuth } from '../context/AuthContext';
import { monthName, tl } from '../lib/format';
import { ROLE_LABELS } from '../lib/rates';

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
          <p className="mt-1 text-sm text-[var(--muted)]">Hakem ücretlerinizi ve maçlarınızı takip edin.</p>
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
        <div className="panel flex items-center gap-4 p-5">
          <div className="rounded-xl border border-[var(--blue)] p-3 text-[var(--blue)]"><CalendarDays size={22} /></div>
          <div>
            <div className="text-xs text-[var(--muted)]">Bu ay yapılan maç</div>
            <div className="text-2xl font-bold">{loading ? '…' : stats.buAy.length} <span className="text-base font-medium text-[var(--muted)]">maç</span></div>
            <div className="text-[11px] text-[var(--muted-2)]">{monthName(stats.now.getMonth())} {stats.now.getFullYear()}</div>
          </div>
        </div>

        <div className="panel flex items-center gap-4 p-5">
          <div className="rounded-xl border border-[var(--green)] p-3 text-[var(--green)]"><CircleDollarSign size={22} /></div>
          <div>
            <div className="text-xs text-[var(--muted)]">Ortalama maç başı kazanç</div>
            <div className="text-2xl font-bold">{loading ? '…' : tl(stats.ort)}</div>
            <div className="text-[11px] text-[var(--muted-2)]">Girilen tüm maçların ortalaması</div>
          </div>
        </div>

        <div className="panel flex items-center gap-4 p-5">
          <div className="rounded-xl border border-[var(--gold)] p-3 text-[var(--gold)]"><Trophy size={22} /></div>
          <div>
            <div className="text-xs text-[var(--muted)]">En sık çıktığınız tür</div>
            <div className="text-2xl font-bold">{loading ? '…' : stats.enSikAdi}</div>
            <div className="text-[11px] text-[var(--muted-2)]">{stats.yuzde}% · {stats.enSikAdet} maç</div>
          </div>
        </div>
      </div>

      <section className="panel mt-6 overflow-hidden">
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
            <p className="text-sm text-[var(--muted)]">Henüz maç eklemediniz.</p>
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
      </section>

      {profile?.username && <div className="no-print mt-4 text-right text-xs text-[var(--muted-2)]">@{profile.username}</div>}
    </div>
  );
}
