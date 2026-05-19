import { AppShell } from '../components/layout/AppShell';
import { OwnerDashboard } from '../features/owner/OwnerDashboard';

export function OwnerPage() {
  return (
    <AppShell title="Painel Owner">
      <OwnerDashboard />
    </AppShell>
  );
}
