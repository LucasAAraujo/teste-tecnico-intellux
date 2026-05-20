import api from '../lib/axios';
import type { Member, Organization } from '../types';

export type OrgPage = {
  items: Organization[];
  total: number;
  page: number;
  totalPages: number;
};

export const organizationsService = {
  async getAll(page = 1, limit = 10): Promise<OrgPage> {
    const res = await api.get<{ data: OrgPage }>('/organizations', { params: { page, limit } });
    return res.data.data;
  },

  async getMembers(organizationId: string): Promise<Member[]> {
    const res = await api.get<{ data: Member[] }>(`/organizations/${organizationId}/members`);
    return res.data.data;
  },
};
