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
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      sessionStorage.removeItem('auth');
      window.location.replace('/login');
    } else if (status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
    }
    return Promise.reject(error);
  },
);

export default api;
