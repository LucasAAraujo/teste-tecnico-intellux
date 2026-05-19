import api from '../lib/axios';
import type { InviteValidation } from '../types';

export type ActivateDto = {
  token: string;
  name: string;
  password: string;
  orgName?: string;
};

export const invitesService = {
  async validate(token: string): Promise<InviteValidation> {
    const res = await api.get<InviteValidation>(`/invites/validate/${token}`);
    return res.data;
  },

  async activate(dto: ActivateDto): Promise<void> {
    await api.post('/invites/activate', dto);
  },
};
