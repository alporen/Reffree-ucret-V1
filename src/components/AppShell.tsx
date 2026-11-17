import { useEffect, useState } from 'react';
import { Menu, LogOut, X, ChevronRight, Handshake, LayoutGrid, ListChecks, BarChart3, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tl } from '../lib/format';

const NAV = [
  { to: '/', label: 'Ana Sayfa', icon: LayoutGrid },
  { to: '/mac-ekle', label: 'Maç Ekle', icon: ListChecks },
  { to: '/aylik-tablo', label: 'Aylık Tablo', icon: ListChecks },
  { to: '/istatistikler', label: 'İstatistikler', icon: BarChart3 },
];

export default function AppShell({ children, toplam }: { children: React.ReactNode; toplam?: number }) {
  const { configError, cikisYap } = useAuth();
  const navigate = useNavigate();
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    setAcik(false);
  }, [children]);

  const icerik = (
    <aside className="sidebar no-print flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-2)] px-5 py-6">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)] font-black text-[#06281a]"
        >
          H
        </div>
        <div className="leading-tight">
          <div className="font-bold">Hakem Ücret</div>
          <div className="text-xs text-[var(--muted)]">Takibi</div>
        </div>
      </div>

      <div className="label mt-8 px-1">MENÜ</div>
      <nav className="mt-1 flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setAcik(false)}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <button onClick={() => navigate('/ayarlar')} className="sidebar-item w-full justify-between text-left">
          <span className="flex items-center gap-3">
            <Settings size={18} /> Ayarlar
          </span>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => { void cikisYap().then(() => navigate('/giris')); }} className="sidebar-item w-full text-left text-[var(--red)]">
          <LogOut size={18} /> Çıkış yap
        </button>
        {typeof toplam === 'number' && (
          <div className="chip mt-1 justify-between">
            <span>Genel toplam kazanç</span>
            <span className="font-bold text-[var(--green)]">{tl(toplam)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 px-2 text-xs text-[var(--muted-2)]">
          <span className="h-2 w-2 rounded-full bg-[var(--green)]" /> Maç ve kazanç takibi
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Masaüstü kenar çubuğu */}
      <div className="hidden md:block">{icerik}</div>

      {/* Mobil: üst bar + çekmece */}
      <div className="flex h-full flex-1 flex-col">
        <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-2)] px-4 md:hidden">
          <button aria-label="Menü" onClick={() => setAcik((v) => !v)} className="rounded-lg p-2 hover:bg-[var(--panel-2)]">
            {acik ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-sm font-bold">Hakem Ücret Takibi</span>
          {configError ? <Handshake size={20} className="text-[var(--gold)]" /> : <span className="w-6" />}
        </header>
        {acik && <div className="no-print absolute z-40 h-full md:hidden">{icerik}</div>}

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
