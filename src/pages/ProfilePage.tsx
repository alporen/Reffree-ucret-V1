import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemePicker, SeasonPicker } from '../components/Preferences';
import { ChangePasswordForm, AccountPanel } from '../components/AccountSections';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { hash } = useLocation();

  // /profil#sifre ile gelindiğinde şifre bölümüne kaydır
  useEffect(() => {
    if (hash !== '#sifre') return;
    const el = document.getElementById('sifre');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="no-print mb-3 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={16} /> Geri
      </button>

      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--green)]">HESAP</div>
      <h1 className="mt-1 text-2xl font-bold">Profil</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Hesabınızı, şifrenizi ve görünüm tercihlerinizi buradan yönetin.</p>

      <AccountPanel />
      <div id="sifre" className="scroll-mt-4"><ChangePasswordForm /></div>

      <section className="panel mt-4 p-5">
        <h2 className="font-semibold">Tema</h2>
        <p className="text-xs text-[var(--muted)]">Uygulamanın görünümünü seçin.</p>
        <div className="mt-3"><ThemePicker /></div>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="font-semibold">Sezon</h2>
        <p className="text-xs text-[var(--muted)]">Ücret tablosunun hangi sezona ait olduğunu belirler.</p>
        <SeasonPicker />
      </section>
    </div>
  );
}
