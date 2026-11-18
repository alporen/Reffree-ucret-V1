import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSeason } from '../lib/season';

/** Koyu/Açık tema seçici — Ayarlar ve Profil sayfaları paylaşır. */
export function ThemePicker() {
  const { tema, setTema } = useTheme();
  return (
    <div className="flex gap-3">
      <button
        onClick={() => setTema('koyu')}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm ${tema === 'koyu' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}
      >
        <Moon size={16} /> Koyu
      </button>
      <button
        onClick={() => setTema('acik')}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm ${tema === 'acik' ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]' : 'border-[var(--border-2)] text-[var(--muted)]'}`}
      >
        <Sun size={16} /> Açık
      </button>
    </div>
  );
}

/** Sezon seçici — Ayarlar ve Profil sayfaları paylaşır. */
export function SeasonPicker() {
  const { seasons, sezonId, setSezon } = useSeason();
  return (
    <select className="input mt-3" value={sezonId ?? ''} onChange={(e) => setSezon(Number(e.target.value))}>
      {seasons.length === 0 && <option value="">Sezon bulunamadı</option>}
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}
