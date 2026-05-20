import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

// axios → auth.store → auth.service → axios
function getToken(): string | null {
  try {
    const raw = sessionStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as { response?: { status?: number }; config?: { url?: string } };
    const status = err.response?.status;
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginRequest) {
      sessionStorage.removeItem('auth');
      window.location.replace('/login');
    } else if (status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
    }
    return Promise.reject(error);
  },
);

export default api;
