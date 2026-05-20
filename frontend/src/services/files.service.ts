import api from '../lib/axios';
import type { FileFilters, FileItem } from '../types';

export const filesService = {
  async getAll(filters: FileFilters = {}): Promise<FileItem[]> {
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.search) params.search = filters.search;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.userId) params.userId = filters.userId;
    const res = await api.get<FileItem[]>('/files', { params });
    return res.data;
  },

  async upload(file: File, onProgress?: (pct: number) => void): Promise<FileItem> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<FileItem>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
      },
    });
    return res.data;
  },

  async getShares(fileId: string): Promise<{ recipientId: string }[]> {
    const res = await api.get<{ recipientId: string }[]>(`/files/${fileId}/shares`);
    return res.data;
  },

  async share(fileId: string, recipientIds: string[]): Promise<void> {
    await api.post(`/files/${fileId}/share`, { recipientIds });
  },
};
