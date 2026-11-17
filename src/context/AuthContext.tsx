import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured, supabaseConfigError } from '../lib/supabase';
import { normalizeLogin } from '../lib/format';

export interface Profile {
  id: string;
  username: string;
  is_admin: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configError: string | null;
}

interface AuthContextValue extends AuthState {
  girisYap: (kimlik: string, sifre: string) => Promise<{ error: string | null }>;
  kayitOl: (username: string, email: string, sifre: string) => Promise<{ error: string | null; requiresConfirmation?: boolean }>;
  sifreSifirla: (email: string) => Promise<{ error: string | null }>;
  cikisYap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function turkceHata(mesaj: string | null | undefined): string {
  if (!mesaj) return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  const m = mesaj.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Bilgiler hatalı (kullanıcı adı/e-posta veya şifre yanlış).';
  if (m.includes('email not confirmed')) return 'E-postanızı henüz doğrulamadınız. Gelen kutunuzdaki onay bağlantısına tıklayın.';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Bu e-posta ile zaten kayıt var.';
  if (m.includes('password should be')) return 'Şifre en az 8 karakter olmalı.';
  if (m.includes('unable to validate email')) return 'Geçerli bir e-posta adresi yazın.';
  if (m.includes('duplicate key') || m.includes('profiles_username')) return 'Bu kullanıcı adı zaten alınmış.';
  if (m.includes('rate limit')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
  return mesaj;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabaseConfigured) return null;
    const { data } = await supabase.from('profiles').select('id, username, is_admin').eq('id', uid).maybeSingle();
    return (data as Profile | null) ?? null;
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      if (next?.user) {
        loadProfile(next.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const girisYap: AuthContextValue['girisYap'] = useCallback(async (kimlik, sifre) => {
    if (!supabaseConfigured) return { error: supabaseConfigError };
    const { value, isEmail } = normalizeLogin(kimlik);
    if (!value || !sifre) return { error: 'Kullanıcı adı/e-posta ve şifre gerekli.' };

    let email = value;
    if (!isEmail) {
      const { data, error: rpcError } = await supabase.rpc('get_email_by_username', { p_username: value });
      if (rpcError || !data) return { error: 'Kullanıcı adı bulunamadı.' };
      email = String(data);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
    return { error: error ? turkceHata(error.message) : null };
  }, []);

  const kayitOl: AuthContextValue['kayitOl'] = useCallback(async (username, email, sifre) => {
    if (!supabaseConfigured) return { error: supabaseConfigError };
    const uname = username.trim().toLowerCase();
    const mail = email.trim().toLowerCase();
    if (!/^[a-z0-9_çğıöşü.-]{3,24}$/i.test(uname)) return { error: 'Kullanıcı adı 3–24 karakter olmalı; harf, rakam, "_" ve "." kullanabilirsiniz.' };
    if (sifre.length < 8) return { error: 'Şifre en az 8 karakter olmalı.' };

    const { error } = await supabase.auth.signUp({
      email: mail,
      password: sifre,
      options: {
        data: { username: uname },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: turkceHata(error.message) };
    return { error: null, requiresConfirmation: true };
  }, []);

  const sifreSifirla: AuthContextValue['sifreSifirla'] = useCallback(async (email) => {
    if (!supabaseConfigured) return { error: supabaseConfigError };
    const mail = email.trim().toLowerCase();
    if (!mail.includes('@')) return { error: 'Geçerli bir e-posta adresi yazın.' };
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: window.location.origin + '/sifre-yenile',
    });
    return { error: error ? turkceHata(error.message) : null };
  }, []);

  const cikisYap = useCallback(async () => {
    if (supabaseConfigured) await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      configError: supabaseConfigError,
      girisYap,
      kayitOl,
      sifreSifirla,
      cikisYap,
    }),
    [session, user, profile, loading, girisYap, kayitOl, sifreSifirla, cikisYap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  return ctx;
}
