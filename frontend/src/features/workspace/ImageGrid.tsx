import { useEffect, useRef, useState } from 'react';
import { useImageFiles } from '../../hooks/useImageFiles';
import type { FileItem } from '../../types';
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
  src: string;
  alt: string;
  onClick: () => void;
};

function LazyImage({ src, alt, onClick }: LazyImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
    <div ref={wrapRef} className={s.cell} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      {visible ? (
        <img
          src={src}
          alt={alt}
          className={`${s.img} ${loaded ? s.imgLoaded : ''}`}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className={s.placeholder} />
      )}
      {!loaded && visible && <div className={s.placeholder} />}
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
export function ImageGrid() {
  const state = useImageFiles();
  const [preview, setPreview] = useState<FileItem | null>(null);

  if (state.status === 'loading') {
    return (
      <div className={s.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${s.cell} ${s.skeleton}`} />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return <p className={s.errorText}>{state.message}</p>;
  }

  if (state.files.length === 0) {
    return (
      <div className={s.empty}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <p>Nenhuma imagem ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className={s.grid}>
        {state.files.map((file) => (
          <LazyImage
            key={file.id}
            src={imageUrl(file.storagePath)}
            alt={file.name}
            onClick={() => setPreview(file)}
          />
        ))}
      </div>

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
