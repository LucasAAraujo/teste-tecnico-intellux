import { AppShell } from '../components/layout/AppShell';
import { ImageGrid } from '../features/workspace/ImageGrid';
import { WorkspaceList } from '../features/workspace/WorkspaceList';
import s from './Workspace.module.scss';

export function WorkspacePage() {
  return (
    <AppShell title="Workspace">
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Arquivos de texto</h2>
        <WorkspaceList />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Imagens</h2>
        <ImageGrid />
      </section>
    </AppShell>
  );
}
