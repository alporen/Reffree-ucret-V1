import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight, Handshake, ListChecks, BarChart3, Settings, PlusCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tl } from '../lib/format';
import { DUR } from '../lib/motion';
import { cn } from '../lib/cn';
import ProfileMenu from './ProfileMenu';

const NAV = [
  { to: '/mac-ekle', label: 'Maç Ekle', icon: PlusCircle },
  { to: '/aylik-tablo', label: 'Aylık Tablo', icon: ListChecks },
  { to: '/istatistikler', label: 'İstatistikler', icon: BarChart3 },
];

function SidebarContent({ onNavigate, toplam }: { onNavigate?: () => void; toplam?: number }) {
  const { configError } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="no-print flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--bg-2)] px-5 py-6 md:w-64">
      {/* Logo — tıklayınca Ana Sayfa */}
      <NavLink to="/" end onClick={onNavigate} aria-label="Ana sayfaya git" title="Ana sayfa" className="flex items-center gap-3 rounded-xl transition hover:bg-[var(--panel-2)]">
        <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--green)] font-black text-[#06281a]">H</div>
        <div className="leading-tight">
          <div className="font-bold">Hakem Ücret</div>
          <div className="text-xs text-[var(--muted)]">Takibi</div>
        </div>
      </NavLink>

      <div className="label mt-8 px-1">MENÜ</div>
      <nav className="mt-1 flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <button onClick={() => { onNavigate?.(); navigate('/ayarlar'); }} className="sidebar-item w-full justify-between text-left">
          <span className="flex items-center gap-3"><Settings size={18} /> Ayarlar</span>
          <ChevronRight size={16} />
        </button>
        {/* Genel toplam kazanç + profil sekmesi — profil, toplam yüklenmeden de görünür */}
        <div className="mt-1">
          <ProfileMenu variant={onNavigate ? 'drawer' : 'sidebar'}>
            {typeof toplam === 'number' && (
              <div className="chip min-w-0 flex-1 justify-between">
                <span className="truncate">Genel toplam kazanç</span>
                <span className="shrink-0 font-bold text-[var(--green)]">{tl(toplam)}</span>
              </div>
            )}
          </ProfileMenu>
        </div>
        {configError && <div className="mt-2 flex items-center gap-2 px-2 text-xs text-[var(--gold)]"><Handshake size={14} /> Bağlantı yapılandırılmadı</div>}
        <div className="mt-2 flex items-center gap-2 px-2 text-xs text-[var(--muted-2)]">
          <span className="h-2 w-2 rounded-full bg-[var(--green)]" /> Maç ve kazanç takibi
        </div>
      </div>
    </aside>
  );
}

export default function AppShell({ children, toplam }: { children: React.ReactNode; toplam?: number }) {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    setAcik(false);
  }, [children]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="hidden md:block no-print"><SidebarContent toplam={toplam} /></div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Mobil üst bar: menü + logo (ana sayfa) + profil */}
        <header className="no-print flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg-2)] px-3 sm:px-4 md:hidden">
          <button aria-label="Menü" onClick={() => setAcik((v) => !v)} className="rounded-lg p-2 hover:bg-[var(--panel-2)]">
            {acik ? <X size={22} /> : <Menu size={22} />}
          </button>
          <NavLink to="/" end aria-label="Ana sayfaya git" className="min-w-0 rounded-lg px-2 py-1 text-sm font-bold leading-tight transition hover:bg-[var(--panel-2)]">
            Hakem Ücret Takibi
          </NavLink>
          <ProfileMenu variant="topbar" />
        </header>

        <AnimatePresence>
          {acik && (
            <>
              <motion.div
                className="fixed inset-0 z-30 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR }}
                onClick={() => setAcik(false)}
              />
              <motion.div className="no-print fixed inset-y-0 right-0 z-40 w-72 md:hidden" initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: DUR, ease: [0.22, 1, 0.36, 1] }}>
                <button aria-label="Kapat" onClick={() => setAcik(false)} className="absolute right-3 top-3 z-10 rounded-lg p-2 hover:bg-[var(--panel-2)]"><X size={18} /></button>
                <SidebarContent onNavigate={() => setAcik(false)} toplam={toplam} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>

        {/* Mobil alt bar: Ana Sayfa yok — logo üst barda home işlevi görüyor */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch justify-around border-t border-[var(--border)] bg-[var(--bg-2)] md:hidden" aria-label="Sayfalar">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-1 flex-col items-center justify-center gap-1 text-[10px]', isActive ? 'text-[var(--green)]' : 'text-[var(--muted)]')}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
