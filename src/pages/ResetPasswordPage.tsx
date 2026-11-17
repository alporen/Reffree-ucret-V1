import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function ResetPasswordPage() {
  const { sifreSifirla, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    const { error } = await sifreSifirla(email);
    setYukleniyor(false);
    if (error) return setHata(error);
    setGonderildi(true);
  }

  if (gonderildi) {
    return (
      <AuthLayout
        title="E-posta gönderildi"
        subtitle="Şifre yenileme bağlantısı yolda."
        footer={<Link to="/giris" className="font-semibold text-[var(--green)] hover:underline">Giriş sayfasına dön</Link>}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <Mail size={44} className="text-[var(--green)]" />
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--text)]">{email.trim().toLowerCase()}</span> adresine bir şifre yenileme
            bağlantısı gönderdik. Gelen kutunuzu kontrol edin.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Şifremi unuttum"
      subtitle="Kayıtlı e-postanızı yazın; size yenileme bağlantısı gönderelim."
      footer={<Link to="/giris" className="font-semibold text-[var(--green)] hover:underline">Giriş sayfasına dön</Link>}
    >
      {configError && (
        <div className="mb-4 rounded-lg border border-[var(--gold)] bg-[color:rgba(224,169,67,0.08)] p-3 text-xs text-[var(--gold)]">
          {configError}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="label">E-posta</label>
          <input id="email" type="email" className="input" autoFocus autoComplete="email" placeholder="ornek@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {hata && <div className="rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.08)] p-3 text-xs text-[var(--red)]">{hata}</div>}
        <button type="submit" className="btn-primary" disabled={yukleniyor}>
          {yukleniyor ? 'Gönderiliyor…' : 'Yenileme bağlantısı gönder'}
        </button>
      </form>
    </AuthLayout>
  );
}
