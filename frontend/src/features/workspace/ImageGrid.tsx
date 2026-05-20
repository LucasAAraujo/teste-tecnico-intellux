import { useEffect, useRef, useState } from 'react';
import { useImageFiles } from '../../hooks/useImageFiles';
import type { FileItem } from '../../types';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import s from './ImageGrid.module.scss';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://localhost:3000/api').replace(/\/api$/, '');

function imageUrl(storagePath: string): string {
  const filename = storagePath.replace(/^.*[/\\]/, '');
  return `${API_BASE}/uploads/${filename}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

// ── Lazy image ────────────────────────────────────────────
type LazyImageProps = {
  file: FileItem;
  canShare: boolean;
  currentUserId: string;
  onClick: () => void;
  onShare: () => void;
};

function LazyImage({ file, canShare, currentUserId, onClick, onShare }: LazyImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isShared = file.createdBy !== currentUserId;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={s.cell}>
      {visible ? (
        <img
          src={imageUrl(file.storagePath)}
          alt={file.name}
          className={`${s.img} ${loaded ? s.imgLoaded : ''}`}
          onLoad={() => setLoaded(true)}
          onClick={onClick}
        />
      ) : (
        <div className={s.placeholder} />
      )}
      {!loaded && visible && <div className={s.placeholder} />}

      {isShared && file.uploader && (
        <div className={s.sharedBadge}>
          Compartilhado por {file.uploader.name}
        </div>
      )}

      <div className={s.overlay}>
        <button className={s.previewBtn} onClick={onClick} aria-label="Visualizar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
        {canShare && (
          <button className={s.shareBtn} onClick={onShare} aria-label="Compartilhar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Preview modal ────────────────────────────────────────
type PreviewModalProps = {
  file: FileItem;
  onClose: () => void;
};

function PreviewModal({ file, onClose }: PreviewModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={s.backdrop} onClick={onClose} role="dialog" aria-modal>
      <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={s.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        <img src={imageUrl(file.storagePath)} alt={file.name} className={s.previewImg} />
        <div className={s.previewMeta}>
          <span className={s.previewName}>{file.name}</span>
          <span className={s.previewDate}>
            {file.uploader?.name ?? '—'} · {formatDate(file.uploadedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ImageGrid ────────────────────────────────────────────
type Props = {
  refreshKey?: number;
  onShare: (file: FileItem) => void;
};

export function ImageGrid({ refreshKey = 0, onShare }: Props) {
  const { user } = useAuthStore();
  const {
    state,
    members,
    isOwner,
    currentUserId,
    search,
    setSearch,
    from,
    setFrom,
    to,
    setTo,
    userId,
    setUserId,
  } = useImageFiles(refreshKey);
  const [preview, setPreview] = useState<FileItem | null>(null);

  function canShare(file: FileItem): boolean {
    if (user?.role === UserRole.OWNER) return true;
    return file.createdBy === (user?.sub ?? '');
  }

  return (
    <>
      <div className={s.filters}>
        <div className={s.searchWrapper}>
          <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className={s.searchInput}
            placeholder="Buscar imagem..."
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
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>

      {state.status === 'loading' && (
        <div className={s.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${s.cell} ${s.skeleton}`} />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <p className={s.errorText}>{state.message}</p>
      )}

      {state.status === 'ready' && state.files.length === 0 && (
        <div className={s.empty}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p>Nenhuma imagem encontrada.</p>
        </div>
      )}

      {state.status === 'ready' && state.files.length > 0 && (
        <div className={s.grid}>
          {state.files.map((file) => (
            <LazyImage
              key={file.id}
              file={file}
              canShare={canShare(file)}
              currentUserId={currentUserId}
              onClick={() => setPreview(file)}
              onShare={() => onShare(file)}
            />
          ))}
        </div>
      )}

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
