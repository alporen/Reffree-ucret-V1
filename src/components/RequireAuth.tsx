import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
        Yükleniyor…
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
