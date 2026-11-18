import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, KeyRound, LogOut, Moon, Sun, Shield, User as UserIcon, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSeason } from '../lib/season';
import { DUR } from '../lib/motion';

type Variant = 'sidebar' | 'drawer' | 'topbar';

/**
 * Genel toplam kazanç çipinin yanında duran profil sekmesi.
 * Sidebar/drawer varyantında: çip satırın taşıyıcısı olur; panel satırın tamamına hizalanır, yukarı açılır.
 * Topbar varyantında: yalnız avatar; panel sağa hizalı, aşağı açılır.
 * Açınca: kullanıcı, hızlı tema/sezon değiştirme, şifre değiştirme,
 * profil sayfası ve çıkış yapma.
 */
export default function ProfileMenu({ variant = 'sidebar', children }: { variant?: Variant; children?: ReactNode }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { profile, user, cikisYap } = useAuth();
  const { tema, setTema } = useTheme();
  const { seasons, sezonId, setSezon } = useSeason();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setAcik(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!acik) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAcik(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [acik]);

  const harf = (profile?.username?.[0] ?? user?.email?.[0] ?? '?').toLocaleUpperCase('tr-TR');
  const topbar = variant === 'topbar';
  const rootCls = topbar
    ? 'relative shrink-0'
    : 'relative flex min-w-0 flex-1 items-stretch justify-end gap-2';
  const konum = topbar ? 'right-0 top-full mt-2' : 'bottom-full left-0 mb-2';
  const panelWidth = topbar ? 'w-72 max-w-[calc(100vw-2rem)]' : 'w-full min-w-0';
  const girisY = topbar ? -8 : 8;

  return (
    <div ref={ref} className={rootCls}>
      {children}
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-label="Profil menüsü"
        aria-haspopup="menu"
        aria-expanded={acik}
        className="flex h-full min-h-[44px] shrink-0 items-center gap-1.5 self-stretch rounded-xl border border-[var(--border-2)] bg-[var(--chip)] px-2.5 text-[var(--green)] transition hover:border-[var(--green)]"
      >
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--green-soft)] text-xs font-bold">
          {harf}
        </span>
        <ChevronDown size={14} className={`text-[var(--muted)] transition-transform duration-300 ${acik ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {acik && (
          <motion.div
            role="menu"
            aria-label="Profil"
            className={`absolute z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--border-2)] bg-[var(--panel)] p-3 shadow-[var(--shadow)] ${panelWidth} ${konum}`}
            initial={{ opacity: 0, y: girisY, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: girisY > 0 ? 6 : -6, scale: 0.98 }}
            transition={{ duration: DUR, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Kimlik */}
            <div className="flex items-center gap-3 rounded-xl bg-[var(--panel-2)] p-3">
              <div aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--green-soft)] text-base font-bold uppercase text-[var(--green)]">
                {harf}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">@{profile?.username ?? '…'}</span>
                  {profile?.is_admin && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--gold)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--gold)]"><Shield size={9} /> Yönetici</span>
                  )}
                </div>
                <div className="truncate text-[11px] text-[var(--muted)]">{user?.email}</div>
              </div>
            </div>

            {/* Hızlı tema */}
            <div className="mt-3">
              <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Tema</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTema('koyu')}
                  aria-pressed={tema === 'koyu'}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs ${tema === 'koyu' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}
                >
                  <Moon size={14} /> Koyu
                </button>
                <button
                  onClick={() => setTema('acik')}
                  aria-pressed={tema === 'acik'}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs ${tema === 'acik' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}
                >
                  <Sun size={14} /> Açık
                </button>
              </div>
            </div>

            {/* Hızlı sezon */}
            <div className="mt-3">
              <label htmlFor="profil-sezon" className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Sezon</label>
              <select
                id="profil-sezon"
                className="input mt-1.5"
                value={sezonId ?? ''}
                onChange={(e) => setSezon(Number(e.target.value))}
              >
                {seasons.length === 0 && <option value="">Sezon bulunamadı</option>}
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="my-3 border-t border-[var(--border)]" />

            {/* Sayfa kısayolları */}
            <button role="menuitem" onClick={() => navigate('/profil')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--panel-2)]">
              <UserIcon size={16} className="text-[var(--muted)]" /> Profil sayfası
            </button>
            <button role="menuitem" onClick={() => navigate('/profil#sifre')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--panel-2)]">
              <KeyRound size={16} className="text-[var(--muted)]" /> Şifre değiştir
            </button>
            <button role="menuitem" onClick={() => navigate('/ayarlar')} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--panel-2)]">
              <Settings2 size={16} className="text-[var(--muted)]" /> Ayarlar
            </button>

            <div className="my-3 border-t border-[var(--border)]" />

            <button
              role="menuitem"
              onClick={() => { void cikisYap().then(() => navigate('/giris')); }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[var(--red)] hover:bg-[color:rgba(255,107,94,0.1)]"
            >
              <LogOut size={16} /> Çıkış yap
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
