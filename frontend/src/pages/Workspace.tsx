import { AppShell } from '../components/layout/AppShell';
import { WorkspaceList } from '../features/workspace/WorkspaceList';

export function WorkspacePage() {
  return (
    <AppShell title="Workspace">
      <WorkspaceList />
    </AppShell>
  );
}
