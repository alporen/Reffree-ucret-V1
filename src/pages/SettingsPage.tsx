import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemePicker, SeasonPicker } from '../components/Preferences';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">AYARLAR</div>
      <h1 className="mt-1 text-2xl font-bold">Ayarlar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Tema ve sezon tercihlerinizi yönetin. Hesap ve şifre işlemleri Profil sayfasında.</p>

      <section className="panel mt-6 p-5">
        <h2 className="font-semibold">Tema</h2>
        <p className="text-xs text-[var(--muted)]">Uygulamanın görünümünü seçin.</p>
        <div className="mt-3"><ThemePicker /></div>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="font-semibold">Sezon</h2>
        <p className="text-xs text-[var(--muted)]">Ücret tablosunun hangi sezona ait olduğunu belirler.</p>
        <SeasonPicker />
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Profil</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Şifre değiştirme, hesap bilgileri, tema/sezon ve çıkış yapma Profil sayfasında.</p>
        <button onClick={() => navigate('/profil')} className="btn-primary mt-3 flex items-center gap-2">Profil sayfasına git <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}
