import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const { kayitOl, configError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifre2, setSifre2] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [onayBekliyor, setOnayBekliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    if (sifre !== sifre2) return setHata('Şifreler eşleşmiyor.');
    setYukleniyor(true);
    const { error, requiresConfirmation } = await kayitOl(username, email, sifre);
    setYukleniyor(false);
    if (error) return setHata(error);
    if (requiresConfirmation) setOnayBekliyor(true);
  }

  if (onayBekliyor) {
    return (
      <AuthLayout
        title="E-postanızı doğrulayın"
        subtitle="Kaydınızı tamamlamak için tek adım kaldı."
        footer={<Link to="/giris" className="font-semibold text-[var(--green)] hover:underline">Giriş sayfasına dön</Link>}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <MailCheck size={44} className="text-[var(--green)]" />
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--text)]">{email.trim().toLowerCase()}</span> adresine bir onay bağlantısı gönderdik.
            Bağlantıya tıklamadan giriş yapamazsınız. Gelen kutunuzu (gerekirse spam/gereksiz klasörünü) kontrol edin.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Kayıt ol"
      subtitle="Kullanıcı adı, e-posta ve şifreyle hesabınızı oluşturun."
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to="/giris" className="font-semibold text-[var(--green)] hover:underline">Giriş yapın</Link>
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
          <label htmlFor="username" className="label">Kullanıcı adı</label>
          <input id="username" className="input" autoComplete="username" placeholder="ahmet_hakem" value={username} onChange={(e) => setUsername(e.target.value)} />
          <p className="mt-1 text-[11px] text-[var(--muted-2)]">3–24 karakter · harf, rakam, “_” ve “.”</p>
        </div>
        <div>
          <label htmlFor="email" className="label">E-posta</label>
          <input id="email" type="email" className="input" autoComplete="email" placeholder="ornek@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sifre" className="label">Şifre</label>
            <input id="sifre" type="password" className="input" autoComplete="new-password" placeholder="En az 8 karakter" value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </div>
          <div>
            <label htmlFor="sifre2" className="label">Şifre tekrar</label>
            <input id="sifre2" type="password" className="input" autoComplete="new-password" placeholder="Tekrar yazın" value={sifre2} onChange={(e) => setSifre2(e.target.value)} />
          </div>
        </div>
        {hata && <div className="rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.08)] p-3 text-xs text-[var(--red)]">{hata}</div>}
        <button type="submit" className="btn-primary" disabled={yukleniyor}>
          {yukleniyor ? 'Kayıt oluşturuluyor…' : 'Kayıt ol'}
        </button>
      </form>
    </AuthLayout>
  );
}
