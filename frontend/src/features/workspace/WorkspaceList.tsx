import { useState } from 'react';
import { useFiles } from '../../hooks/useFiles';
import s from './WorkspaceList.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://localhost:3000/api').replace(/\/api$/, '');

async function downloadFile(storagePath: string, name: string) {
  const filename = storagePath.replace(/^.*[/\\]/, '');
  const url = `${API_BASE}/uploads/${filename}`;
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon() {
  return (
    <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}


function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

type Props = {
  refreshKey?: number;
};

export function WorkspaceList({ refreshKey = 0 }: Props) {
  const {
    state,
    members,
    isOwner,
    search: appliedSearch,
    from: appliedFrom,
    to: appliedTo,
    userId: appliedUserId,
    setSearch,
    setFrom,
    setTo,
    setUserId,
    clearFilters,
  } = useFiles(refreshKey);

  const [draftSearch, setDraftSearch] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftUserId, setDraftUserId] = useState('');

  const hasActiveDraft = !!(draftSearch || draftFrom || draftTo || draftUserId);
  const hasApplied = !!(appliedSearch || appliedFrom || appliedTo || appliedUserId);

  function applyFilters() {
    setSearch(draftSearch);
    setFrom(draftFrom);
    setTo(draftTo);
    setUserId(draftUserId);
  }

  function clearAll() {
    setDraftSearch('');
    setDraftFrom('');
    setDraftTo('');
    setDraftUserId('');
    clearFilters();
  }

  return (
    <div className={s.container}>
      <div className={s.filters}>
        <div className={s.searchWrapper}>
          <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className={s.searchInput}
            placeholder="Buscar arquivo..."
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
          />
        </div>

        <div className={s.dateRange}>
          <input
            type="date"
            className={s.dateInput}
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            title="De"
          />
          <span className={s.dateSeparator}>–</span>
          <input
            type="date"
            className={s.dateInput}
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            title="Até"
          />
        </div>

        {isOwner && members.length > 0 && (
          <select
            className={s.userSelect}
            value={draftUserId}
            onChange={(e) => setDraftUserId(e.target.value)}
          >
            <option value="">Todos os usuários</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        <button className={s.filterBtn} onClick={applyFilters}>
          Filtrar
        </button>
        {(hasApplied || hasActiveDraft) && (
          <button className={s.clearBtn} onClick={clearAll}>
            Limpar
          </button>
        )}
      </div>

      {state.status === 'loading' && (
        <ul className={s.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className={s.skeletonRow} />
          ))}
        </ul>
      )}

      {state.status === 'error' && (
        <p className={s.errorText}>{state.message}</p>
      )}

      {state.status === 'ready' && state.files.length === 0 && (
        <div className={s.empty}>
          <FileIcon />
          <p>Nenhum arquivo encontrado.</p>
        </div>
      )}

      {state.status === 'ready' && state.files.length > 0 && (
        <ul className={s.list}>
          {state.files.map((file) => (
            <li key={file.id} className={s.row}>
              <FileIcon />

              <div className={s.info}>
                <span className={s.fileName}>{file.name}</span>
                <span className={s.meta}>
                  {file.uploader?.name ?? '—'}
                  <span className={s.dot}>·</span>
                  {formatDate(file.uploadedAt)}
                  <span className={s.dot}>·</span>
                  {formatSize(file.sizeBytes)}
                </span>
              </div>

              <button
                className={s.actionIconBtn}
                onClick={() => void downloadFile(file.storagePath, file.name)}
                title="Baixar"
                aria-label="Baixar arquivo"
              >
                <DownloadIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
