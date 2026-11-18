import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronRight, Handshake, ListChecks, BarChart3, Settings, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tl } from '../lib/format';
import { cn } from '../lib/cn';
import ProfileMenu from './ProfileMenu';

const NAV = [
  { to: '/mac-ekle', label: 'Maç Ekle', icon: PlusCircle },
  { to: '/aylik-tablo', label: 'Aylık Tablo', icon: ListChecks },
  { to: '/istatistikler', label: 'İstatistikler', icon: BarChart3 },
];

function SidebarContent({ toplam }: { toplam?: number }) {
  const { configError } = useAuth();
  const navigate = useNavigate();
  return (
    <aside className="no-print flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--bg-2)] px-5 py-6 md:w-64">
      {/* Logo — tıklayınca Ana Sayfa */}
      <NavLink to="/" end aria-label="Ana sayfaya git" title="Ana sayfa" className="flex items-center gap-3 rounded-xl transition hover:bg-[var(--panel-2)]">
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
            className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <button onClick={() => navigate('/ayarlar')} className="sidebar-item w-full justify-between text-left">
          <span className="flex items-center gap-3"><Settings size={18} /> Ayarlar</span>
          <ChevronRight size={16} />
        </button>
        {/* Genel toplam kazanç + profil sekmesi — profil, toplam yüklenmeden de görünür */}
        <div className="mt-1">
          <ProfileMenu variant="sidebar">
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
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] supports-[height:100dvh]:h-[100dvh]">
      <div className="hidden md:block no-print"><SidebarContent toplam={toplam} /></div>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Mobil üst bar: logo (ana sayfa) + profil — sabit. Yan menü yok; navigasyon alt bardan. */}
        <header className="no-print z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg-2)] px-3 sm:px-4 md:hidden">
          <NavLink to="/" end aria-label="Ana sayfaya git" className="min-w-0 rounded-lg px-2 py-1 text-sm font-bold leading-tight transition hover:bg-[var(--panel-2)]">
            Hakem Ücret Takibi
          </NavLink>
          <ProfileMenu variant="topbar" />
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">{children}</main>

        {/* Mobil alt bar: Ana Sayfa yok — logo üst barda home işlevi görüyor; sabit */}
        <nav className="no-print z-20 flex h-16 shrink-0 items-stretch justify-around border-t border-[var(--border)] bg-[var(--bg-2)] pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Sayfalar">
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
