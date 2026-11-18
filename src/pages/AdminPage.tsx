import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { readSeasons } from '../lib/matches';
import { turkceHata } from '../context/AuthContext';
import type { Season } from '../lib/types';

interface Category { id: number; key: string; label: string; referee: number; assistant: number; fourth: number; sort_order: number }
interface Band { id: number; code: string; label: string; min_km: number | null; max_km: number | null; fee: number }

export default function AdminPage() {
  const { profile } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yeniSezonAdi, setYeniSezonAdi] = useState('');
  const [kayitAcik, setKayitAcik] = useState(false);

  const isAdmin = Boolean(profile?.is_admin);

  useEffect(() => {
    if (!isAdmin) {
      setYukleniyor(false);
      return;
    }
    readSeasons().then(({ data }) => {
      setSeasons(data);
      setSeasonId(data[0]?.id ?? null);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || seasonId == null) return;
    setYukleniyor(true);
    Promise.all([
      supabase.from('fee_categories').select('*').eq('season_id', seasonId).order('sort_order'),
      supabase.from('travel_bands').select('*').eq('season_id', seasonId).order('min_km'),
    ]).then(([c, b]) => {
      setCats((c.data ?? []) as Category[]);
      setBands((b.data ?? []) as Band[]);
      setYukleniyor(false);
    });
  }, [isAdmin, seasonId]);

  function setCat(id: number, alan: keyof Category, deger: string | number) {
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, [alan]: alan === 'label' ? deger : Number(deger) } : c)));
  }
  function setBand(id: number, alan: keyof Band, deger: string | number) {
    setBands((prev) => prev.map((b) => (b.id === id ? { ...b, [alan]: alan === 'label' || alan === 'code' ? deger : Number(deger) } : b)));
  }

  async function kaydet() {
    setHata(null); setMesaj(null);
    setKaydediliyor(true);
    for (const c of cats) {
      const { error } = await supabase.from('fee_categories').update({ label: c.label, referee: c.referee, assistant: c.assistant, fourth: c.fourth, sort_order: c.sort_order }).eq('id', c.id);
      if (error) { setKaydediliyor(false); return setHata(turkceHata(error.message)); }
    }
    for (const b of bands) {
      const { error } = await supabase.from('travel_bands').update({ label: b.label, fee: b.fee, min_km: b.min_km, max_km: b.max_km }).eq('id', b.id);
      if (error) { setKaydediliyor(false); return setHata(turkceHata(error.message)); }
    }
    setKaydediliyor(false);
    setMesaj('Ücret tablosu kaydedildi.');
  }

  async function yeniSezon() {
    setHata(null); setMesaj(null);
    const label = yeniSezonAdi.trim();
    if (!label) return setHata('Sezon adı gerekli (ör. 2027-2028).');
    const { data: season, error: sErr } = await supabase.from('seasons').insert({ label }).select().single();
    if (sErr) return setHata(turkceHata(sErr.message));
    const newId = season.id;
    // mevcut sezonu kopyala
    const { data: srcCats, error: cErr } = await supabase.from('fee_categories').select('*').eq('season_id', seasonId);
    if (cErr) return setHata(turkceHata(cErr.message));
    for (const c of srcCats ?? []) {
      const { error } = await supabase.from('fee_categories').insert({ season_id: newId, key: c.key, label: c.label, referee: c.referee, assistant: c.assistant, fourth: c.fourth, sort_order: c.sort_order });
      if (error) return setHata(turkceHata(error.message));
    }
    const { data: srcBands, error: bErr } = await supabase.from('travel_bands').select('*').eq('season_id', seasonId);
    if (bErr) return setHata(turkceHata(bErr.message));
    for (const b of srcBands ?? []) {
      const { error } = await supabase.from('travel_bands').insert({ season_id: newId, code: b.code, label: b.label, min_km: b.min_km, max_km: b.max_km, fee: b.fee });
      if (error) return setHata(turkceHata(error.message));
    }
    setYeniSezonAdi('');
    setKayitAcik(false);
    const { data: all } = await readSeasons();
    setSeasons(all);
    setSeasonId(newId);
    setMesaj('Yeni sezon oluşturuldu ve kopyalandı.');
  }

  if (!isAdmin) {
    return (
      <div className="panel mx-auto mt-6 max-w-xl p-8 text-center">
        <Users className="mx-auto text-[var(--muted)]" size={32} />
        <h2 className="mt-3 text-lg font-semibold">Yönetici değilsiniz</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Ücret tablosunu yalnızca yönetici düzenleyebilir.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">YÖNETİCİ</div>
          <h1 className="mt-1 text-2xl font-bold">Ücret tablosu</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Maç ücretleri ve yol kademelerini düzenleyin.</p>
        </div>
        <select className="input w-44" value={seasonId ?? ''} onChange={(e) => setSeasonId(Number(e.target.value))}>
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {hata && <div className="panel mt-4 border-[var(--red)] p-3 text-xs text-[var(--red)]">{hata}</div>}
      {mesaj && <div className="panel mt-4 border-[var(--green)] p-3 text-xs text-[var(--green)]">{mesaj}</div>}

      <button onClick={() => setKayitAcik((v) => !v)} className="btn-ghost mt-4 flex items-center gap-2 text-xs"><Plus size={14} /> Yeni sezon oluştur</button>
      {kayitAcik && (
        <div className="panel mt-3 flex items-center gap-3 p-4">
          <input className="input" placeholder="2027-2028" value={yeniSezonAdi} onChange={(e) => setYeniSezonAdi(e.target.value)} />
          <button onClick={yeniSezon} className="btn-primary py-2 text-sm">Mevcut sezondan kopyala</button>
        </div>
      )}

      {yukleniyor ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">Yükleniyor…</div>
      ) : (
        <>
          <section className="panel mt-6 overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="font-semibold">Maç kategorileri ve ücretler</h2>
              <p className="text-xs text-[var(--muted)]">Harcırah ücretin %25 (ev sahibi) / %50 (deplasman) olarak hesaplanır.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  <tr><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Hakem</th><th className="px-4 py-3">Yardımcı</th><th className="px-4 py-3">4. Hakem</th><th className="px-4 py-3">Sıra</th><th className="px-4 py-3" /></tr>
                </thead>
                <tbody>
                  {cats.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2"><input className="input" value={c.label} onChange={(e) => setCat(c.id, 'label', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={c.referee} onChange={(e) => setCat(c.id, 'referee', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={c.assistant} onChange={(e) => setCat(c.id, 'assistant', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={c.fourth} onChange={(e) => setCat(c.id, 'fourth', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={c.sort_order} onChange={(e) => setCat(c.id, 'sort_order', e.target.value)} /></td>
                      <td className="px-4 py-2 text-right"><button className="text-[var(--red)] hover:underline" onClick={async () => { const { error } = await supabase.from('fee_categories').delete().eq('id', c.id); if (error) setHata(turkceHata(error.message)); else setCats((p) => p.filter((x) => x.id !== c.id)); }}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel mt-4 overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="font-semibold">Yol ücreti kademeleri</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  <tr><th className="px-4 py-3">Kod</th><th className="px-4 py-3">Aralık</th><th className="px-4 py-3">Min km</th><th className="px-4 py-3">Max km</th><th className="px-4 py-3">Ücret (TL)</th></tr>
                </thead>
                <tbody>
                  {bands.map((b) => (
                    <tr key={b.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2"><input className="input" value={b.code} onChange={(e) => setBand(b.id, 'code', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className="input" value={b.label} onChange={(e) => setBand(b.id, 'label', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={b.min_km ?? ''} onChange={(e) => setBand(b.id, 'min_km', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={b.max_km ?? ''} onChange={(e) => setBand(b.id, 'max_km', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="number" className="input" value={b.fee} onChange={(e) => setBand(b.id, 'fee', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <button onClick={kaydet} disabled={kaydediliyor} className="btn-primary mt-6 flex items-center gap-2"><Save size={16} /> {kaydediliyor ? 'Kaydediliyor…' : 'Ücret tablosunu kaydet'}</button>
        </>
      )}
    </div>
  );
}
