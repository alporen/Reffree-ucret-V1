import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useAuth, turkceHata } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/** Şifre değiştirme formu — Ayarlar ve Profil sayfaları paylaşır. */
export function ChangePasswordForm() {
  const [sifre, setSifre] = useState('');
  const [sifre2, setSifre2] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function onSifreDegistir(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setMesaj(null);
    if (sifre.length < 8) return setHata('Şifre en az 8 karakter olmalı.');
    if (sifre !== sifre2) return setHata('Şifreler eşleşmiyor.');
    setKaydediliyor(true);
    const { error } = await supabase.auth.updateUser({ password: sifre });
    setKaydediliyor(false);
    if (error) return setHata(turkceHata(error.message));
    setSifre('');
    setSifre2('');
    setMesaj('Şifreniz güncellendi.');
  }

  return (
    <>
      {mesaj && <div className="panel mt-4 border-[var(--green)] p-3 text-xs text-[var(--green)]">{mesaj}</div>}
      {hata && <div className="panel mt-4 border-[var(--red)] p-3 text-xs text-[var(--red)]">{hata}</div>}
      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={16} /> Şifre değiştir</h2>
        <form onSubmit={onSifreDegistir} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="password" className="input" placeholder="Yeni şifre" value={sifre} onChange={(e) => setSifre(e.target.value)} autoComplete="new-password" />
          <input type="password" className="input" placeholder="Yeni şifre tekrar" value={sifre2} onChange={(e) => setSifre2(e.target.value)} autoComplete="new-password" />
          <button type="submit" className="btn-primary sm:col-span-2" disabled={kaydediliyor}>{kaydediliyor ? 'Kaydediliyor…' : 'Şifreyi güncelle'}</button>
        </form>
      </section>
    </>
  );
}

/** Hesap bilgileri + çıkış — Profil sayfasında kullanılır. */
export function AccountPanel() {
  const navigate = useNavigate();
  const { profile, user, cikisYap } = useAuth();
  return (
    <section className="panel mt-4 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Hesap</h2>
      <div className="mt-3 flex items-center gap-3">
        <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--green-soft)] text-lg font-bold uppercase text-[var(--green)]">
          {(profile?.username?.[0] ?? user?.email?.[0] ?? '?').toString()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold"><UserIcon size={14} className="text-[var(--muted-2)]" />@{profile?.username ?? '…'}</div>
          <div className="truncate text-xs text-[var(--muted)]">{user?.email}</div>
          {profile?.is_admin && <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--gold)]"><Shield size={10} /> Yönetici</div>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile?.is_admin && <button onClick={() => navigate('/admin')} className="btn-ghost">Yönetici paneli</button>}
        <button onClick={() => { void cikisYap().then(() => navigate('/giris')); }} className="flex items-center gap-2 rounded-lg border border-[var(--red)] px-3 py-2 text-sm text-[var(--red)]"><LogOut size={14} /> Çıkış yap</button>
      </div>
    </section>
  );
}
