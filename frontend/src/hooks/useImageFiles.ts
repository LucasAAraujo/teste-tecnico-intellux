import { useEffect, useState } from 'react';
import { filesService } from '../services/files.service';
import type { FileItem } from '../types';
import { FileType } from '../types';

type ImageFilesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; files: FileItem[] };

export function useImageFiles(refreshKey = 0) {
  const [state, setState] = useState<ImageFilesState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    filesService
      .getAll({ type: FileType.IMAGE })
      .then((files) => setState({ status: 'ready', files }))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setState({ status: 'error', message: msg ?? 'Erro ao carregar imagens.' });
      });
  }, [refreshKey]);

  return state;
}
