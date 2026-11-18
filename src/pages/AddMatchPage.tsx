import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { matchSchema, type MatchFormValues } from '../lib/schemas';
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
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [bands, setBands] = useState<BandRow[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [veriHata, setVeriHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      match_date: todayIso(),
      category_id: '',
      season_id: '',
      role: 'referee',
      venue: 'home',
      second_same_day: false,
      travel_band_id: '',
      travel_fee: '0',
      harcirah: '0',
    },
  });

  const watched = watch();
  const secondSameDay = watched.second_same_day;
  const venue = watched.venue as Venue;
  const role = watched.role as Role;
  const travelBandId = watched.travel_band_id;
  const categoryId = Number(watched.category_id) || null;
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? categories[0] ?? null,
    [categories, categoryId],
  );
  const selectedBand = useMemo(() => bands.find((b) => b.id === Number(travelBandId)) ?? null, [bands, travelBandId]);

  // Veri yükleme
  useEffect(() => {
    readSeasons().then(({ data, error }) => {
      if (error) { setVeriHata(error); setYukleniyor(false); return; }
      setSeasons(data);
      if (data[0] && !editId) setValue('season_id', String(data[0].id));
    });
  }, [editId, setValue]);

  useEffect(() => {
    const sid = Number(watched.season_id) || seasons[0]?.id;
    if (!sid) return;
    setYukleniyor(true);
    Promise.all([readCategories(sid), readTravelBands(sid)]).then(([c, b]) => {
      if (c.error || b.error) setVeriHata(c.error ?? b.error ?? null);
      setCategories(c.data as CategoryRow[]);
      setBands(b.data as BandRow[]);
      if (!editId && c.data[0]) setValue('category_id', String((c.data[0] as CategoryRow).id));
      setYukleniyor(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.season_id, seasons.length, editId, setValue]);

  // Düzenleme modu
  useEffect(() => {
    if (!editId) return;
    readMatches().then(({ data }) => {
      const m = data.find((x) => x.id === editId);
      if (!m) return;
      reset({
        match_date: m.match_date,
        category_id: String(m.category_id),
        season_id: String(m.season_id),
        role: m.role,
        venue: m.venue,
        second_same_day: m.second_same_day,
        travel_band_id: m.travel_band_id == null ? '' : String(m.travel_band_id),
        travel_fee: String(m.travel_fee),
        harcirah: String(m.harcirah),
      });
    });
  }, [editId, reset]);

  // Yol kademesi seçilince ücreti doldur
  useEffect(() => {
    setValue('travel_fee', String(resolveTravelFee(selectedBand)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelBandId]);

  // Harcırahı otomatik hesapla (düzenlenebilir)
  const base = selectedCategory ? matchFeeFor(selectedCategory, role) : 0;
  const otomatikHarcirah = secondSameDay ? 0 : venue === 'home' ? base * 0.25 : base * 0.5;
  useEffect(() => {
    setValue('harcirah', String(Math.round(otomatikHarcirah * 100) / 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otomatikHarcirah]);

  const totals = selectedCategory
    ? computeMatchTotals(selectedCategory, role, venue, Number(watched.travel_fee) || 0, secondSameDay)
    : null;
  const gosterilecekToplam =
    (totals?.matchFee ?? 0) + (Number(watched.harcirah) || 0) + (secondSameDay ? 0 : Number(watched.travel_fee) || 0);

  const onSubmit = handleSubmit(
    async (values) => {
      if (!selectedCategory) {
        toast.error('Maç türü gerekli.');
        return;
      }
      const payload = {
        match_date: values.match_date,
        category_id: Number(values.category_id),
        season_id: Number(values.season_id),
        role: values.role,
        venue: values.venue,
        second_same_day: values.second_same_day,
        travel_band_id: values.travel_band_id ? Number(values.travel_band_id) : null,
        travel_fee: values.second_same_day ? 0 : Number(values.travel_fee) || 0,
        harcirah: Number(values.harcirah) || 0,
        match_fee: matchFeeFor(selectedCategory, values.role),
      };
      const { error } = editId ? await updateMatch(editId, payload) : await insertMatch(payload);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(editId ? 'Maç güncellendi' : 'Maç eklendi');
      navigate('/aylik-tablo');
    },
    (formErrors) => {
      // Doğrulama başarısız: kullanıcıya göster, ayrıntıyı konsola bırak
      console.error('Maç formu doğrulama hatası:', formErrors);
      toast.error('Form eksik veya hatalı — işaretli alanları kontrol edin.');
    },
  );

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

      {veriHata && <div className="panel mb-6 border-[var(--gold)] p-4 text-sm text-[var(--gold)]">{veriHata}</div>}

      <form onSubmit={onSubmit} className="panel p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="tarih" className="label">Maç tarihi</label>
            <input id="tarih" type="date" className="input" {...register('match_date')} />
            {errors.match_date && <p className="mt-1 text-[11px] text-[var(--red)]">{errors.match_date.message}</p>}
          </div>
          <div>
            <label htmlFor="tur" className="label">Maç türü</label>
            <select id="tur" className="input" {...register('category_id')}>
              {yukleniyor && <option>Yükleniyor…</option>}
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {errors.category_id && <p className="mt-1 text-[11px] text-[var(--red)]">{errors.category_id.message}</p>}
          </div>
          <div>
            <label htmlFor="gorev" className="label">Görev</label>
            <select id="gorev" className="input" {...register('role')}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--gold)] bg-[color:rgba(224,169,67,0.08)] px-3 py-3 text-sm text-[var(--gold)]">
              <Controller name="second_same_day" control={control} render={({ field }) => (
                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
              )} />
              <span>
                <span className="block font-semibold">Aynı gün ve aynı yerde</span>
                <span className="block text-xs opacity-80">2. maç (yol ve harcırah 0 TL)</span>
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="yer" className="label">Görev yeri / harcırah</label>
            <select id="yer" className="input" {...register('venue')}>
              <option value="home">{VENUE_LABELS.home}</option>
              <option value="away">{VENUE_LABELS.away}</option>
            </select>
          </div>
          <div>
            <label htmlFor="yolmesafe" className="label">Yol mesafesi</label>
            <Controller name="travel_band_id" control={control} render={({ field }) => (
              <select id="yolmesafe" className="input" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} disabled={secondSameDay}>
                <option value="">Yol ücreti yok</option>
                {bands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            )} />
          </div>
          <div>
            <label htmlFor="yol" className="label">Yol ücreti (TL)</label>
            <input id="yol" type="number" step="0.01" min={0} className="input" disabled={secondSameDay} {...register('travel_fee')} />
            {errors.travel_fee && <p className="mt-1 text-[11px] text-[var(--red)]">{errors.travel_fee.message}</p>}
            <p className="mt-1 text-[11px] text-[var(--muted-2)]">Kilometre aralığı seçildiğinde ücret gelir; tutarı değiştirebilirsiniz.</p>
          </div>
          <div>
            <label htmlFor="harcirah" className="label">Harcırah (TL)</label>
            <input id="harcirah" type="number" step="0.01" min={0} className="input" disabled={secondSameDay} {...register('harcirah')} />
            {errors.harcirah && <p className="mt-1 text-[11px] text-[var(--red)]">{errors.harcirah.message}</p>}
            <p className="mt-1 text-[11px] text-[var(--muted-2)]">Maç ücretine göre hesaplanır; tutarı değiştirebilirsiniz.</p>
          </div>
          {seasons.length > 1 && (
            <div>
              <label htmlFor="sezon" className="label">Sezon</label>
              <select id="sezon" className="input" {...register('season_id')}>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
          {[
            { label: 'Maç ücreti', value: tl(totals?.matchFee ?? 0) },
            { label: 'Yol ücreti', value: tl(secondSameDay ? 0 : Number(watched.travel_fee) || 0) },
            { label: 'Harcırah', value: tl(Number(watched.harcirah) || 0) },
            { label: 'Bu maçın toplamı', value: tl(gosterilecekToplam), accent: true },
          ].map((cell) => (
            <div key={cell.label} className="bg-[var(--panel-2)] p-4">
              <div className="text-[11px] text-[var(--muted)]">{cell.label}</div>
              <div className={`mt-1 font-bold ${cell.accent ? 'text-[var(--green)]' : ''}`}>{cell.value}</div>
            </div>
          ))}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="panel mt-6 border-[var(--red)] p-4 text-xs text-[var(--red)]">
            Gönderilemedi — kırmızı alanları kontrol edin: {Object.values(errors).map((e) => e?.message).filter(Boolean).join(' · ')}
          </div>
        )}

        <button type="submit" className="btn-primary mt-6 flex items-center gap-2" disabled={isSubmitting || yukleniyor}>
          {editId ? <Save size={18} /> : <PlusCircle size={18} />}
          {isSubmitting ? 'Kaydediliyor…' : editId ? 'Değişiklikleri kaydet' : 'Maçı ekle'}
        </button>
      </form>
    </div>
  );
}
