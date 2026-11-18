import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import AppShell from './components/AppShell';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DUR } from './lib/motion';
import { readMatches } from './lib/matches';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import DashboardPage from './pages/DashboardPage';
import AddMatchPage from './pages/AddMatchPage';
import MonthlyPage from './pages/MonthlyPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

function PageFade({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: DUR, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Korumali({ children }: { children: React.ReactNode }) {
  const [toplam, setToplam] = useState<number | undefined>(undefined);
  useEffect(() => {
    readMatches().then(({ data }) => setToplam(data.reduce((a, m) => a + m.total, 0)));
  }, []);
  return (
    <RequireAuth>
      <AppShell toplam={toplam}>
        <PageFade>{children}</PageFade>
      </AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/giris" element={<LoginPage />} />
            <Route path="/kayit" element={<RegisterPage />} />
            <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
            <Route path="/sifre-yenile" element={<UpdatePasswordPage />} />
            <Route path="/" element={<Korumali><DashboardPage /></Korumali>} />
            <Route path="/mac-ekle" element={<Korumali><AddMatchPage /></Korumali>} />
            <Route path="/aylik-tablo" element={<Korumali><MonthlyPage /></Korumali>} />
            <Route path="/istatistikler" element={<Korumali><StatsPage /></Korumali>} />
            <Route path="/ayarlar" element={<Korumali><SettingsPage /></Korumali>} />
            <Route path="/profil" element={<Korumali><ProfilePage /></Korumali>} />
            <Route path="/admin" element={<Korumali><AdminPage /></Korumali>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors toastOptions={{ duration: 3000 }} position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
