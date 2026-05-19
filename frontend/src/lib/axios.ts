import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
    } else if (status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
    }
    return Promise.reject(error);
  },
);

export default api;
