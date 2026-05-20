import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ImageGrid } from '../features/workspace/ImageGrid';
import { ShareModal } from '../features/workspace/ShareModal';
import { UploadModal } from '../features/workspace/UploadModal';
import { WorkspaceList } from '../features/workspace/WorkspaceList';
import type { FileItem } from '../types';
import s from './Workspace.module.scss';

export function WorkspacePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);

  function handleUploadSuccess() {
    setUploadOpen(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <AppShell title="Workspace">
      <div className={s.pageHeader}>
        <button className={s.uploadBtn} onClick={() => setUploadOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Enviar arquivo
        </button>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Arquivos de texto</h2>
        <WorkspaceList refreshKey={refreshKey} onShare={setShareTarget} />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Imagens</h2>
        <ImageGrid refreshKey={refreshKey} onShare={setShareTarget} />
      </section>

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
      )}

      {shareTarget && (
        <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </AppShell>
  );
}
