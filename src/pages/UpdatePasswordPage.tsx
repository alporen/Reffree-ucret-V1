import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { turkceHata } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { configError } = useAuth();
  const [sifre, setSifre] = useState('');
  const [sifre2, setSifre2] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHata(null);
    if (sifre.length < 8) return setHata('Şifre en az 8 karakter olmalı.');
    if (sifre !== sifre2) return setHata('Şifreler eşleşmiyor.');
    setYukleniyor(true);
    const { error } = await supabase.auth.updateUser({ password: sifre });
    setYukleniyor(false);
    if (error) return setHata(turkceHata(error.message));
    navigate('/', { replace: true });
  }

  return (
    <AuthLayout title="Yeni şifre belirleyin" subtitle="Bağlantı çalıştı; yeni şifrenizi iki kez yazın.">
      {configError && (
        <div className="mb-4 rounded-lg border border-[var(--gold)] bg-[color:rgba(224,169,67,0.08)] p-3 text-xs text-[var(--gold)]">
          {configError}
        </div>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="sifre" className="label">Yeni şifre</label>
          <input id="sifre" type="password" className="input" autoComplete="new-password" placeholder="En az 8 karakter" value={sifre} onChange={(e) => setSifre(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sifre2" className="label">Yeni şifre tekrar</label>
          <input id="sifre2" type="password" className="input" autoComplete="new-password" placeholder="Tekrar yazın" value={sifre2} onChange={(e) => setSifre2(e.target.value)} />
        </div>
        {hata && <div className="rounded-lg border border-[var(--red)] bg-[color:rgba(255,107,94,0.08)] p-3 text-xs text-[var(--red)]">{hata}</div>}
        <button type="submit" className="btn-primary" disabled={yukleniyor}>
          {yukleniyor ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </button>
      </form>
    </AuthLayout>
  );
}
