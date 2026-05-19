import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { ActivatePage } from './pages/Activate';
import { SuperAdminPage } from './pages/SuperAdmin';
import { useAuthStore } from './store/auth.store';
import { UserRole } from './types';

function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
      {label} — em construção
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<ActivatePage />} />
        <Route path="/403" element={<Placeholder label="403 — Acesso negado" />} />

        {/* Protected */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute roles={[UserRole.SUPER_ADMIN]}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute roles={[UserRole.OWNER]}>
              <Placeholder label="Owner Dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute roles={[UserRole.OWNER, UserRole.USER]}>
              <Placeholder label="Workspace" />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
