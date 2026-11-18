import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { readSeasons } from '../lib/matches';
import { turkceHata } from '../context/AuthContext';
import type { Season } from '../lib/types';

const SEASON_KEY = 'hakem-sezon';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, cikisYap } = useAuth();
  const { tema, setTema } = useTheme();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [sezonId, setSezonId] = useState<number | null>(null);
  const [sifre, setSifre] = useState('');
  const [sifre2, setSifre2] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    readSeasons().then(({ data }) => {
      setSeasons(data);
      let kayitli: number | null = null;
      try {
        const v = localStorage.getItem(SEASON_KEY);
        kayitli = v ? Number(v) : null;
      } catch { /* site verisi engelli */ }
      setSezonId(kayitli ?? data[0]?.id ?? null);
    });
  }, []);

  function onSezonChange(id: number) {
    setSezonId(id);
    try { localStorage.setItem(SEASON_KEY, String(id)); } catch { /* yok say */ }
    setMesaj('Sezon tercihi kaydedildi.');
  }

  async function onSifreDegistir(e: React.FormEvent) {
    e.preventDefault();
    setHata(null); setMesaj(null);
    if (sifre.length < 8) return setHata('Şifre en az 8 karakter olmalı.');
    if (sifre !== sifre2) return setHata('Şifreler eşleşmiyor.');
    setKaydediliyor(true);
    const { error } = await supabase.auth.updateUser({ password: sifre });
    setKaydediliyor(false);
    if (error) return setHata(turkceHata(error.message));
    setSifre(''); setSifre2('');
    setMesaj('Şifreniz güncellendi.');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">AYARLAR</div>
      <h1 className="mt-1 text-2xl font-bold">Ayarlar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Tema, sezon ve hesap ayarlarınızı yönetin.</p>

      {mesaj && <div className="panel mt-4 border-[var(--green)] p-3 text-xs text-[var(--green)]">{mesaj}</div>}
      {hata && <div className="panel mt-4 border-[var(--red)] p-3 text-xs text-[var(--red)]">{hata}</div>}

      <section className="panel mt-6 p-5">
        <h2 className="font-semibold">Tema</h2>
        <p className="text-xs text-[var(--muted)]">Uygulamanın görünümünü seçin.</p>
        <div className="mt-3 flex gap-3">
          <button onClick={() => setTema('koyu')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm ${tema === 'koyu' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}>
            <Moon size={16} /> Koyu
          </button>
          <button onClick={() => setTema('acik')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm ${tema === 'acik' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}>
            <Sun size={16} /> Açık
          </button>
        </div>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="font-semibold">Sezon</h2>
        <p className="text-xs text-[var(--muted)]">Ücret tablosunun hangi sezona ait olduğunu belirler.</p>
        <select className="input mt-3" value={sezonId ?? ''} onChange={(e) => onSezonChange(Number(e.target.value))}>
          {seasons.length === 0 && <option value="">Sezon bulunamadı</option>}
          {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={16} /> Şifre değiştir</h2>
        <form onSubmit={onSifreDegistir} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="password" className="input" placeholder="Yeni şifre" value={sifre} onChange={(e) => setSifre(e.target.value)} autoComplete="new-password" />
          <input type="password" className="input" placeholder="Yeni şifre tekrar" value={sifre2} onChange={(e) => setSifre2(e.target.value)} autoComplete="new-password" />
          <button type="submit" className="btn-primary sm:col-span-2" disabled={kaydediliyor}>{kaydediliyor ? 'Kaydediliyor…' : 'Şifreyi güncelle'}</button>
        </form>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Hesap</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">@{profile?.username ?? '…'}{profile?.is_admin ? ' · yönetici' : ''}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile?.is_admin && <button onClick={() => navigate('/admin')} className="btn-ghost">Yönetici paneli</button>}
          <button onClick={() => { void cikisYap().then(() => navigate('/giris')); }} className="flex items-center gap-2 rounded-lg border border-[var(--red)] px-3 py-2 text-sm text-[var(--red)]"><LogOut size={14} /> Çıkış yap</button>
        </div>
      </section>
    </div>
  );
}
