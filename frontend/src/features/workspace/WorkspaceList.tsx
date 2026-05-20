import { useFiles } from '../../hooks/useFiles';
import type { FileItem } from '../../types';
import { UserRole } from '../../types';
import s from './WorkspaceList.module.scss';

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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

type Props = {
  refreshKey?: number;
  onShare: (file: FileItem) => void;
};

export function WorkspaceList({ refreshKey = 0, onShare }: Props) {
  const {
    state,
    members,
    isOwner,
    currentUserId,
    currentUserRole,
    search,
    setSearch,
    from,
    setFrom,
    to,
    setTo,
    userId,
    setUserId,
  } = useFiles(refreshKey);

  function canShare(file: FileItem): boolean {
    if (currentUserRole === UserRole.OWNER) return true;
    return file.createdBy === currentUserId;
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={s.dateRange}>
          <input
            type="date"
            className={s.dateInput}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            title="De"
          />
          <span className={s.dateSeparator}>–</span>
          <input
            type="date"
            className={s.dateInput}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            title="Até"
          />
        </div>

        {isOwner && members.length > 0 && (
          <select
            className={s.userSelect}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Todos os usuários</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
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
          {state.files.map((file) => {
            const isShared = file.createdBy !== currentUserId;
            return (
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

                {isShared && file.uploader && (
                  <span className={s.sharedBadge}>
                    Compartilhado por {file.uploader.name}
                  </span>
                )}

                {canShare(file) && (
                  <button
                    className={s.shareIconBtn}
                    onClick={() => onShare(file)}
                    title="Compartilhar"
                    aria-label="Compartilhar arquivo"
                  >
                    <ShareIcon />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
