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
};
