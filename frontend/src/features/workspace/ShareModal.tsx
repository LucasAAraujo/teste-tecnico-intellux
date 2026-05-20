import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { filesService } from '../../services/files.service';
import { organizationsService } from '../../services/organizations.service';
import { useAuthStore } from '../../store/auth.store';
import type { FileItem, Member } from '../../types';
import s from './ShareModal.module.scss';

type Props = {
  file: FileItem;
  onClose: () => void;
};

type LoadState = 'loading' | 'ready' | 'error';

export function ShareModal({ file, onClose }: Props) {
  const { user } = useAuthStore();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [members, setMembers] = useState<Member[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState<string | null>(null);
  const sharingRef = useRef(sharing);
  sharingRef.current = sharing;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!user?.organizationId) return;
    Promise.all([
      organizationsService.getMembers(user.organizationId),
      filesService.getShares(file.id),
    ])
      .then(([mems, shares]) => {
        setMembers(mems);
        setSharedIds(new Set(shares.map((s) => s.recipientId)));
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [file.id, user?.organizationId]);

  async function handleShare(memberId: string) {
    setSharing(memberId);
    try {
      await filesService.share(file.id, [memberId]);
      setSharedIds((prev) => new Set([...prev, memberId]));
      toast.success('Arquivo compartilhado com sucesso.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Erro ao compartilhar.');
    } finally {
      setSharing(null);
    }
  }

  const visibleMembers = members.filter((m) => m.id !== user?.sub);

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div>
            <h2 className={s.title}>Compartilhar arquivo</h2>
            <p className={s.subtitle} title={file.name}>{file.name}</p>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {loadState === 'loading' && (
          <ul className={s.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={s.skeletonRow} />
            ))}
          </ul>
        )}

        {loadState === 'error' && (
          <p className={s.errorText}>Erro ao carregar membros.</p>
        )}

        {loadState === 'ready' && visibleMembers.length === 0 && (
          <p className={s.emptyText}>Sem outros membros na organização.</p>
        )}

        {loadState === 'ready' && visibleMembers.length > 0 && (
          <ul className={s.list}>
            {visibleMembers.map((member) => {
              const alreadyShared = sharedIds.has(member.id);
              const isAuthor = member.id === file.createdBy;
              const isSharingThis = sharing === member.id;

              return (
                <li key={member.id} className={s.memberRow}>
                  <div className={s.avatar}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={s.memberInfo}>
                    <span className={s.memberName}>{member.name}</span>
                    <span className={s.memberEmail}>{member.email}</span>
                  </div>
                  <div className={s.action}>
                    {isAuthor ? (
                      <span className={s.badge}>Autor</span>
                    ) : alreadyShared ? (
                      <span className={`${s.badge} ${s.badgeShared}`}>Já compartilhado</span>
                    ) : (
                      <button
                        className={s.shareBtn}
                        onClick={() => handleShare(member.id)}
                        disabled={isSharingThis}
                      >
                        {isSharingThis ? 'Compartilhando…' : 'Compartilhar'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
