import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import DashboardPage from './pages/DashboardPage';
import AddMatchPage from './pages/AddMatchPage';
import MonthlyPage from './pages/MonthlyPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function Korumali({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
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
            <Route path="/admin" element={<Korumali><AdminPage /></Korumali>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
