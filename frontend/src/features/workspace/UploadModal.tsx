import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { filesService } from '../../services/files.service';
import s from './UploadModal.module.scss';

const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,text/plain,text/csv,application/pdf';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

type ModalState = 'idle' | 'uploading' | 'done';

export function UploadModal({ onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File) {
    setFile(f);
    setProgress(0);
    setModalState('idle');
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setModalState('uploading');
    setProgress(0);
    try {
      await filesService.upload(file, setProgress);
      setModalState('done');
      toast.success(`"${file.name}" enviado com sucesso.`);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Erro ao fazer upload.');
      setModalState('idle');
    }
  }

  const isUploading = modalState === 'uploading';
  const isDone = modalState === 'done';

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Enviar arquivo</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div
          className={`${s.dropZone} ${dragOver ? s.dragOver : ''} ${file ? s.hasFile : ''}`}
          onClick={() => !file && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className={s.hiddenInput}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {!file && (
            <div className={s.dropPrompt}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span className={s.dropText}>Arraste um arquivo ou <strong>clique para selecionar</strong></span>
              <span className={s.dropHint}>Imagens, texto, CSV, PDF · máx. 10 MB</span>
            </div>
          )}

          {file && (
            <div className={s.filePreview}>
              {preview ? (
                <img src={preview} alt={file.name} className={s.imgPreview} />
              ) : (
                <div className={s.fileIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
              )}
              <div className={s.fileName}>{file.name}</div>
              {!isUploading && !isDone && (
                <button
                  type="button"
                  className={s.changeBtn}
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); inputRef.current?.click(); }}
                >
                  Trocar arquivo
                </button>
              )}
            </div>
          )}
        </div>

        {file && (isUploading || isDone) && (
          <div className={s.progressWrap}>
            <div className={s.progressBar}>
              <div
                className={`${s.progressFill} ${isDone ? s.progressDone : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={s.progressLabel}>
              {isDone ? 'Concluído!' : `${progress}%`}
            </span>
          </div>
        )}

        <div className={s.footer}>
          <button type="button" className={s.cancelBtn} onClick={onClose} disabled={isUploading}>
            Cancelar
          </button>
          <button
            type="button"
            className={s.uploadBtn}
            onClick={handleUpload}
            disabled={!file || isUploading || isDone}
          >
            {isUploading ? 'Enviando…' : isDone ? 'Enviado!' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
