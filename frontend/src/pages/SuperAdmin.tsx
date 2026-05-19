import { AppShell } from '../components/layout/AppShell';
import { SuperAdminDashboard } from '../features/superadmin/SuperAdminDashboard';

export function SuperAdminPage() {
  return (
    <AppShell title="Painel Super Admin">
      <SuperAdminDashboard />
    </AppShell>
  );
}
