import api from '../lib/axios';
import type { AuthUser } from '../types';

function decodeJwt(token: string): AuthUser | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as AuthUser;
  } catch {
    return null;
  }
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password });
    const token = res.data.access_token;
    const user = decodeJwt(token);
    if (!user) throw new Error('Token inválido recebido do servidor');
    return { token, user };
  },
};
