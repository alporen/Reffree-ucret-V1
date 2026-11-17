import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const { girisYap, configError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [kimlik, setKimlik] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    const { error } = await girisYap(kimlik, sifre);
    setYukleniyor(false);
    if (error) return setHata(error);
    navigate(from, { replace: true });
  }

  return (
    <AuthLayout
      title="Giriş yap"
      subtitle="Kullanıcı adınız veya e-postanız ile girin."
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-[var(--green)] hover:underline">
            Kayıt olun
          </Link>
        </>
      }
    >
      {configError && (
        <div className="mb-4 rounded-lg border border-[var(--gold)] bg-[color:rgba(224,169,67,0.08)] p-3 text-xs text-[var(--gold)]">
          {configError}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="kimlik" className="label">Kullanıcı adı veya e-posta</label>
          <input
            id="kimlik"
            className="input"
            autoComplete="username"
            autoFocus
            placeholder="ahmet_hakem  veya  ahmet@ornek.com"
            value={kimlik}
            onChange={(e) => setKimlik(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sifre" className="label">Şifre</label>
          <input
            id="sifre"
            type="password"
            className="input"
            autoComplete="current-password"
            placeholder="••••••••"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
          />
        </div>
        {hata && <div className="rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.08)] p-3 text-xs text-[var(--red)]">{hata}</div>}
        <button type="submit" className="btn-primary" disabled={yukleniyor}>
          {yukleniyor ? 'Giriliyor…' : 'Giriş yap'}
        </button>
        <Link to="/sifre-sifirla" className="text-center text-xs text-[var(--muted)] hover:text-[var(--text)]">
          Şifremi unuttum
        </Link>
      </form>
    </AuthLayout>
  );
}
