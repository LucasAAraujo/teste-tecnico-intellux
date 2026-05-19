import api from '../lib/axios';
import type { Organization } from '../types';

export const organizationsService = {
  async getAll(): Promise<Organization[]> {
    const res = await api.get<Organization[]>('/organizations');
    return res.data;
  },
};
