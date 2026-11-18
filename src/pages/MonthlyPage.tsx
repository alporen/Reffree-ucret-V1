import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Printer, FileSpreadsheet, Pencil, Trash2, X, CalendarRange } from 'lucide-react';
import { readMatches, deleteMatch, groupMatchesByMonth } from '../lib/matches';
import { monthName, tl } from '../lib/format';
import { ROLE_LABELS } from '../lib/rates';
import { useAuth } from '../context/AuthContext';
import type { MatchRow } from '../lib/types';

export default function MonthlyPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading, configError } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [acikAy, setAcikAy] = useState<string | null>(null);
  const [siliniyorId, setSiliniyorId] = useState<string | null>(null);
  const [silmeOnayId, setSilmeOnayId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setMatches([]);
      setLoading(false);
      return;
    }
    readMatches().then(({ data, error }) => {
      if (error) setHata(error);
      setMatches(data);
      setLoading(false);
    });
  }, [session, authLoading]);

  const ayliklar = useMemo(() => groupMatchesByMonth(matches), [matches]);
  const genelToplam = useMemo(() => matches.reduce((a, m) => a + m.total, 0), [matches]);

  const secili = acikAy ? ayliklar.find((a) => a.key === acikAy) ?? null : null;

  async function onDelete(id: string) {
    setSiliniyorId(id);
    const { error } = await deleteMatch(id);
    setSiliniyorId(null);
    setSilmeOnayId(null);
    if (error) return setHata(error);
    const { data } = await readMatches();
    setMatches(data);
  }

  async function exportExcel() {
    try {
	if (!secili) return;
    setHata(null);
    const { month, year } = secili;
    const matchesNow = secili.matches;
    const totalNow = secili.total;
    const label = `${monthName(month - 1)} ${year}`;
    const XLSX = await import('xlsx');
    const rows = matchesNow.map((m) => ({
      Tarih: new Date(m.match_date + 'T00:00:00').toLocaleDateString('tr-TR'),
      'Maç türü': m.category_label,
      Görev: ROLE_LABELS[m.role],
      'Maç ücreti': m.match_fee,
      Yol: m.travel_fee,
      Harcırah: m.harcirah,
      Toplam: m.total,
    }));
    rows.push({ Tarih: '', 'Maç türü': '', Görev: 'AYLIK TOPLAM', 'Maç ücreti': matchesNow.reduce((a, m) => a + m.match_fee, 0), Yol: matchesNow.reduce((a, m) => a + m.travel_fee, 0), Harcırah: matchesNow.reduce((a, m) => a + m.harcirah, 0), Toplam: totalNow });
    const ws = XLSX.utils.json_to_sheet(rows);
    // sütun genişlikleri
    ws['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    const paraAdi = ['Maç ücreti', 'Yol', 'Harcırah', 'Toplam'];
    const header = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
    const colIndex: Record<string, number> = {};
    header[0]?.forEach((h, i) => { colIndex[String(h)] = i; });
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let r = 1; r <= range.e.r; r++) {
      for (const name of paraAdi) {
        const idx = colIndex[name];
        if (idx == null) continue;
        const cell = ws[XLSX.utils.encode_cell({ r, c: idx })];
        if (cell && typeof cell.v === 'number') cell.z = '#,##0.00" ₺"';
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `${year}-${String(month).padStart(2, '0')}-aylik-tablo.xlsx`);
    } catch (err) {
      setHata('Excel oluşturulamadı: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function yazdir() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Yazdırma başlığı (yalnız @media print) */}
      <div className="print-only mb-4 hidden">
        <h1 className="text-xl font-bold">Hakem Ücret Takibi — Aylık Maç Tablosu</h1>
        {secili && <p className="text-sm">{secili.year} {monthName(secili.month - 1)} · {secili.count} maç · Aylık toplam {tl(secili.total)}</p>}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">MAÇ TABLOLARI</div>
          <h1 className="mt-1 text-2xl font-bold">Aylık Tablo</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Aylara göre maçlarınızı görüntüleyin ve dışa aktarın.</p>
        </div>
        <div className="no-print chip">
          <span>Genel toplam kazanç</span>
          <span className="text-base font-bold text-[var(--green)]">{tl(genelToplam)}</span>
        </div>
      </div>

      {configError && <div className="no-print panel mt-4 border-[var(--gold)] p-4 text-xs text-[var(--gold)]">{configError}</div>}
      {hata && <div className="no-print panel mt-4 border-[var(--red)] p-4 text-xs text-[var(--red)]">{hata}</div>}
      {!session && !authLoading && (
        <div className="panel mt-6 p-8 text-center">
          <h2 className="text-lg font-semibold">Oturum açmanız gerekiyor</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Aylık tablonun canlı verilerini görmek ve dışa aktarmak için Supabase ile giriş yapmalısınız.</p>
          <button onClick={() => navigate('/giris')} className="btn-primary mt-5">Giriş yap</button>
        </div>
      )}

      {/* Ay kartları */}
      {session && !secili && (
        <section className="mt-6">
          <h2 className="font-semibold">Aylık Tablo</h2>
          <p className="text-xs text-[var(--muted)]">Ay kartına tıklayarak maç tablosunu açın.</p>
          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">Yükleniyor…</div>
          ) : ayliklar.length === 0 ? (
            <div className="panel mt-4 p-10 text-center">
              <p className="text-sm text-[var(--muted)]">Henüz maç eklemediniz.</p>
              <button onClick={() => navigate('/mac-ekle')} className="btn-primary mt-4">İlk maçı ekleyin</button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ayliklar.map((a) => (
                <button key={a.key} onClick={() => setAcikAy(a.key)} className="panel group flex flex-col items-start p-5 text-left transition hover:border-[var(--green)]">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-soft)] text-[var(--green)]">
                      <CalendarRange size={20} />
                    </div>
                    <ChevronRight className="text-[var(--muted-2)] transition group-hover:translate-x-1 group-hover:text-[var(--green)]" size={18} />
                  </div>
                  <div className="mt-4 font-bold">{a.year} {monthName(a.month - 1)}</div>
                  <div className="text-xs text-[var(--muted)]">{a.count} maç</div>
                  <div className="mt-2 text-lg font-bold text-[var(--green)]">{tl(a.total)}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Seçilen ayın tablosu */}
      {session && secili && (
        <section className="mt-6 panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--green)]">AYLIK MAÇ TABLOSU</div>
              <h2 className="mt-1 text-2xl font-bold">{secili.year} {monthName(secili.month - 1)}</h2>
              <p className="text-xs text-[var(--muted)]">{secili.count} maç · Aylık toplam {tl(secili.total)}</p>
            </div>
            <div className="no-print flex items-center gap-2">
              <button onClick={yazdir} className="btn-ghost flex items-center gap-2 text-xs"><Printer size={16} /> PDF olarak kaydet</button>
              <button onClick={exportExcel} className="btn-ghost flex items-center gap-2 text-xs"><FileSpreadsheet size={16} /> Excel indir</button>
              <button onClick={() => setAcikAy(null)} aria-label="Kapat" className="rounded-lg border border-[var(--border-2)] p-2 hover:border-[var(--muted-2)]"><X size={16} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                <tr><th className="px-5 py-3">Tarih</th><th className="px-5 py-3">Maç türü</th><th className="px-5 py-3">Görev</th><th className="px-5 py-3">Maç ücreti</th><th className="px-5 py-3">Yol</th><th className="px-5 py-3">Harcırah</th><th className="px-5 py-3">Toplam</th><th className="px-5 py-3 no-print">İşlem</th></tr>
              </thead>
              <tbody>
                {secili.matches.map((m) => (
                  <tr key={m.id} className="border-t border-[var(--border)] align-middle">
                    <td className="px-5 py-3 font-semibold">{new Date(m.match_date + 'T00:00:00').toLocaleDateString('tr-TR')}</td>
                    <td className="px-5 py-3">{m.category_label}</td>
                    <td className="px-5 py-3"><span className="rounded-full border border-[var(--green)] bg-[var(--green-soft)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--green)]">{ROLE_LABELS[m.role]}</span></td>
                    <td className="px-5 py-3">{tl(m.match_fee)}</td>
                    <td className="px-5 py-3">{tl(m.travel_fee)}</td>
                    <td className="px-5 py-3">{tl(m.harcirah)}</td>
                    <td className="px-5 py-3 font-semibold">{tl(m.total)}</td>
                    <td className="no-print px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/mac-ekle?id=' + m.id)} className="flex items-center gap-1 rounded-lg border border-[var(--border-2)] px-2 py-1 text-xs text-[var(--blue)] hover:border-[var(--blue)]"><Pencil size={12} /> Düzenle</button>
                        {silmeOnayId === m.id ? (
                          <button onClick={() => onDelete(m.id)} disabled={siliniyorId === m.id} className="flex items-center gap-1 rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.12)] px-2 py-1 text-xs text-[var(--red)]">{siliniyorId === m.id ? 'Siliniyor…' : 'Onayla'}</button>
                        ) : (
                          <button onClick={() => setSilmeOnayId(m.id)} className="flex items-center gap-1 rounded-lg border border-[var(--red)] px-2 py-1 text-xs text-[var(--red)] hover:bg-[color:rgba(255,107,94,0.1)]"><Trash2 size={12} /> Sil</button>
                        )}
                        {silmeOnayId === m.id && <button onClick={() => setSilmeOnayId(null)} className="rounded-lg px-2 py-1 text-xs text-[var(--muted)]">Vazgeç</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border-2)] bg-[color:rgba(255,107,94,0.05)] font-bold text-[var(--red)]">
                  <td className="px-5 py-3 uppercase text-xs" colSpan={3}>AYLIK TOPLAM</td>
                  <td className="px-5 py-3">{tl(secili.matches.reduce((a, m) => a + m.match_fee, 0))}</td>
                  <td className="px-5 py-3">{tl(secili.matches.reduce((a, m) => a + m.travel_fee, 0))}</td>
                  <td className="px-5 py-3">{tl(secili.matches.reduce((a, m) => a + m.harcirah, 0))}</td>
                  <td className="px-5 py-3">{tl(secili.total)}</td>
                  <td className="no-print px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="no-print border-t border-[var(--border)] p-4 text-[11px] text-[var(--muted-2)]">PDF için açıları yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanın.</p>
        </section>
      )}
    </div>
  );
}
