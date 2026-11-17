import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tema = 'koyu' | 'acik';

interface ThemeContextValue {
  tema: Tema;
  setTema: (t: Tema) => void;
  toggleTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTema(t: Tema) {
  document.documentElement.setAttribute('data-tema', t);
  try {
    localStorage.setItem('hakem-tema', t);
  } catch {
    /* bazı tarayıcılar (gizli mod, engellenen site verisi) */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => {
    try {
      return (localStorage.getItem('hakem-tema') as Tema) ?? 'koyu';
    } catch {
      return 'koyu';
    }
  });

  useEffect(() => {
    applyTema(tema);
  }, [tema]);

  const setTema = (t: Tema) => setTemaState(t);
  const toggleTema = () => setTemaState((t) => (t === 'koyu' ? 'acik' : 'koyu'));

  return <ThemeContext.Provider value={{ tema, setTema, toggleTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalıdır');
  return ctx;
}
