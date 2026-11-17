import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** .env doldurulmamışsa true olur ve arayüz yapılandırma hatasını gösterir. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url ?? 'https://example.supabase.co',
  anonKey ?? 'local-dev-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const supabaseConfigError = supabaseConfigured
  ? null
  : 'Supabase bağlantısı yapılandırılmamış. Proje klasöründeki .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini doldurun (bkz. uygulama-plani.md → Yayın).';
