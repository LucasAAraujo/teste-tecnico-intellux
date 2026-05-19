import api from '../lib/axios';
import type { Member, Organization } from '../types';

export const organizationsService = {
  async getAll(): Promise<Organization[]> {
    const res = await api.get<Organization[]>('/organizations');
    return res.data;
  },

  async getMembers(organizationId: string): Promise<Member[]> {
    const res = await api.get<Member[]>(`/organizations/${organizationId}/members`);
    return res.data;
  },
};
