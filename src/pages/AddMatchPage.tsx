import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Save } from 'lucide-react';
import {
  computeMatchTotals,
  matchFeeFor,
  resolveTravelFee,
  ROLE_LABELS,
  VENUE_LABELS,
  type Role,
  type Venue,
} from '../lib/rates';
import {
  insertMatch,
  readCategories,
  readMatches,
  readSeasons,
  readTravelBands,
  updateMatch,
} from '../lib/matches';
import { tl } from '../lib/format';
import { useAuth } from '../context/AuthContext';

interface CategoryRow { id: number; key: string; label: string; referee: number; assistant: number; fourth: number }
interface BandRow { id: number; code: string; label: string; fee: number }

function todayIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function AddMatchPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [seasons, setSeasons] = useState<{ id: number; label: string }[]>([]);
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [bands, setBands] = useState<BandRow[]>([]);

  const [matchDate, setMatchDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [role, setRole] = useState<Role>('referee');
  const [venue, setVenue] = useState<Venue>('home');
  const [secondSameDay, setSecondSameDay] = useState(false);
  const [bandId, setBandId] = useState<number | null>(null); // null → yol ücreti yok
  const [travelFee, setTravelFee] = useState('0');
  const [harcirah, setHarcirah] = useState('0');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [veriHata, setVeriHata] = useState<string | null>(null);

  // Sezonları yükle
  useEffect(() => {
    readSeasons().then(({ data, error }) => {
      if (error) {
        setVeriHata(error);
        setYukleniyor(false);
        return;
      }
      setSeasons(data);
      setSeasonId(data[0]?.id ?? null);
    });
  }, []);

  // Seçili sezonda kategorileri ve kademeleri yükle
  useEffect(() => {
    if (seasonId == null) return;
    setYukleniyor(true);
    Promise.all([readCategories(seasonId), readTravelBands(seasonId)]).then(([c, b]) => {
      if (c.error || b.error) setVeriHata(c.error ?? b.error ?? null);
      setCategories(c.data as CategoryRow[]);
      setBands(b.data as BandRow[]);
      setYukleniyor(false);
    });
  }, [seasonId]);

  // Düzenleme modunda mevcut kaydı yükle
  useEffect(() => {
    if (!editId) return;
    readMatches().then(({ data }) => {
      const m = data.find((x) => x.id === editId);
      if (!m) return;
      setMatchDate(m.match_date);
      setCategoryId(m.category_id);
      setRole(m.role);
      setVenue(m.venue);
      setSecondSameDay(m.second_same_day);
      setBandId(m.travel_band_id);
      setTravelFee(String(m.travel_fee));
      setHarcirah(String(m.harcirah));
    });
  }, [editId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? categories[0] ?? null,
    [categories, categoryId],
  );
  const effectiveCategoryId = categoryId ?? selectedCategory?.id ?? null;
  const selectedBand = useMemo(() => bands.find((b) => b.id === bandId) ?? null, [bands, bandId]);

  // Yol kademesi seçilince ücreti doldur (kullanıcı elle değiştirmişse ezmez)
  useEffect(() => {
    setTravelFee(String(resolveTravelFee(selectedBand)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandId]);

  // 2. maç işaretliyse yol ve harcırah 0'lanır
  const base = selectedCategory ? matchFeeFor(selectedCategory, role) : 0;
  const otomatikHarcirah = secondSameDay ? 0 : venue === 'home' ? base * 0.25 : base * 0.5;
  useEffect(() => {
    setHarcirah(String(Math.round(otomatikHarcirah * 100) / 100));
  }, [otomatikHarcirah]);

  const totals = selectedCategory
    ? computeMatchTotals(
        selectedCategory,
        role,
        venue,
        Number(travelFee) || 0,
        secondSameDay,
      )
    : null;
  // Harcırah kullanıcı tarafından elle değiştirilebilir; canlı toplam onu izler
  const gosterilecekToplam = (totals?.matchFee ?? 0) + (Number(harcirah) || 0) + (secondSameDay ? 0 : (Number(travelFee) || 0));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    if (!selectedCategory || seasonId == null || effectiveCategoryId == null) {
      setHata('Maç türü ve sezon gerekli.');
      return;
    }
    const payload = {
      match_date: matchDate,
      category_id: effectiveCategoryId,
      season_id: seasonId,
      role,
      venue,
      second_same_day: secondSameDay,
      travel_band_id: bandId,
      travel_fee: secondSameDay ? 0 : Number(travelFee) || 0,
      harcirah: Number(harcirah) || 0,
      match_fee: matchFeeFor(selectedCategory, role),
    };
    setKaydediliyor(true);
    const { error } = editId ? await updateMatch(editId, payload) : await insertMatch(payload);
    setKaydediliyor(false);
    if (error) return setHata(error);
    navigate('/aylik-tablo');
  }

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => navigate(-1)} className="no-print mb-3 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Geri
      </button>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">MAÇ KAYIT</div>
          <h1 className="mt-1 text-2xl font-bold">{editId ? 'Maç düzenle' : 'Maç ekle'}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Maç bilgilerini ve görev ücretini girin.</p>
        </div>
        {profile?.username && <div className="chip">@{profile.username}</div>}
      </div>

      {veriHata && (
        <div className="panel mb-6 border-[var(--gold)] p-4 text-sm text-[var(--gold)]">{veriHata}</div>
      )}

      <form onSubmit={onSubmit} className="panel p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="tarih" className="label">Maç tarihi</label>
            <input id="tarih" type="date" className="input" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="tur" className="label">Maç türü</label>
            <select id="tur" className="input" value={effectiveCategoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))} required>
              {yukleniyor && <option>Yükleniyor…</option>}
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="gorev" className="label">Görev</label>
            <select id="gorev" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--gold)] bg-[color:rgba(224,169,67,0.08)] px-3 py-3 text-sm text-[var(--gold)]">
              <input type="checkbox" checked={secondSameDay} onChange={(e) => setSecondSameDay(e.target.checked)} />
              <span>
                <span className="block font-semibold">Aynı gün ve aynı yerde</span>
                <span className="block text-xs opacity-80">2. maç (yol ve harcırah 0 TL)</span>
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="yer" className="label">Görev yeri / harcırah</label>
            <select id="yer" className="input" value={venue} onChange={(e) => setVenue(e.target.value as Venue)}>
              <option value="home">{VENUE_LABELS.home}</option>
              <option value="away">{VENUE_LABELS.away}</option>
            </select>
          </div>
          <div>
            <label htmlFor="yolmesafe" className="label">Yol mesafesi</label>
            <select id="yolmesafe" className="input" value={bandId ?? 'yok'} onChange={(e) => setBandId(e.target.value === 'yok' ? null : Number(e.target.value))} disabled={secondSameDay}>
              <option value="yok">Yol ücreti yok</option>
              {bands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="yol" className="label">Yol ücreti (TL)</label>
            <input id="yol" type="number" step="0.01" min={0} className="input" value={travelFee} onChange={(e) => setTravelFee(e.target.value)} disabled={secondSameDay} />
            <p className="mt-1 text-[11px] text-[var(--muted-2)]">Kilometre aralığı seçildiğinde ücret gelir; tutarı değiştirebilirsiniz.</p>
          </div>
          <div>
            <label htmlFor="harcirah" className="label">Harcırah (TL)</label>
            <input id="harcirah" type="number" step="0.01" min={0} className="input" value={harcirah} onChange={(e) => setHarcirah(e.target.value)} disabled={secondSameDay} />
            <p className="mt-1 text-[11px] text-[var(--muted-2)]">Maç ücretine göre hesaplanır; tutarı değiştirebilirsiniz.</p>
          </div>
          {seasons.length > 1 && (
            <div>
              <label htmlFor="sezon" className="label">Sezon</label>
              <select id="sezon" className="input" value={seasonId ?? ''} onChange={(e) => setSeasonId(Number(e.target.value))}>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Canlı toplam önizleme */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
          {[
            { label: 'Maç ücreti', value: tl(totals?.matchFee ?? 0) },
            { label: 'Yol ücreti', value: tl(secondSameDay ? 0 : Number(travelFee) || 0) },
            { label: 'Harcırah', value: tl(Number(harcirah) || 0) },
            { label: 'Bu maçın toplamı', value: tl(gosterilecekToplam), accent: true },
          ].map((cell) => (
            <div key={cell.label} className="bg-[var(--panel-2)] p-4">
              <div className="text-[11px] text-[var(--muted)]">{cell.label}</div>
              <div className={`mt-1 font-bold ${cell.accent ? 'text-[var(--green)]' : ''}`}>{cell.value}</div>
            </div>
          ))}
        </div>

        {hata && <div className="mt-4 rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.08)] p-3 text-xs text-[var(--red)]">{hata}</div>}

        <button type="submit" className="btn-primary mt-6 flex items-center gap-2" disabled={kaydediliyor || yukleniyor}>
          {editId ? <Save size={18} /> : <PlusCircle size={18} />}
          {kaydediliyor ? 'Kaydediliyor…' : editId ? 'Değişiklikleri kaydet' : 'Maçı ekle'}
        </button>
      </form>
    </div>
  );
}
