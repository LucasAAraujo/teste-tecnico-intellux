import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuthUser = {
  sub: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
};

function decodeJwt(token: string): AuthUser | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token) => set({ token, user: decodeJwt(token) }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
