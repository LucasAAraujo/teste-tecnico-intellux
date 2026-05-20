import { useEffect, useState } from 'react';
import { filesService } from '../services/files.service';
import { organizationsService } from '../services/organizations.service';
import { useAuthStore } from '../store/auth.store';
import type { FileFilters, FileItem, Member } from '../types';
import { FileType, UserRole } from '../types';

type ImageFilesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; files: FileItem[] };

export function useImageFiles(refreshKey = 0) {
  const { user } = useAuthStore();
  const isOwner = user?.role === UserRole.OWNER;

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState<ImageFilesState>({ status: 'loading' });
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isOwner || !user?.organizationId) return;
    organizationsService.getMembers(user.organizationId).then(setMembers).catch(() => {});
  }, [isOwner, user?.organizationId]);

  useEffect(() => {
    setState({ status: 'loading' });
    const filters: FileFilters = { type: FileType.IMAGE };
    if (debouncedSearch) filters.search = debouncedSearch;
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (userId) filters.userId = userId;

    filesService
      .getAll(filters)
      .then((files) => setState({ status: 'ready', files }))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setState({ status: 'error', message: msg ?? 'Erro ao carregar imagens.' });
      });
  }, [debouncedSearch, from, to, userId, refreshKey]);

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setFrom('');
    setTo('');
    setUserId('');
  }

  return {
    state,
    members,
    isOwner,
    currentUserId: user?.sub ?? '',
    search,
    setSearch,
    from,
    setFrom,
    to,
    setTo,
    userId,
    setUserId,
    clearFilters,
  };
}
