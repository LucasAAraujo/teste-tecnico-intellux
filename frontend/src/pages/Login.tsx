import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../types';
import s from './Login.module.scss';

const schema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((st) => st.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      if (user?.role === UserRole.SUPER_ADMIN) navigate('/superadmin/dashboard');
      else if (user?.role === UserRole.OWNER) navigate('/owner/dashboard');
      else navigate('/workspace');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Credenciais inválidas');
    }
  };

  const [hintOpen, setHintOpen] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hintOpen) return;
    function handleClick(e: MouseEvent) {
      if (hintRef.current && !hintRef.current.contains(e.target as Node)) {
        setHintOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [hintOpen]);

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div ref={hintRef} className={s.hintWrapper}>
          <button
            className={s.hintTrigger}
            onClick={() => setHintOpen((o) => !o)}
            aria-label="Credenciais de demonstração"
            title="Credenciais de demonstração"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
            </svg>
          </button>

          {hintOpen && (
            <div className={s.hintCard}>
              <p className={s.hintTitle}>Acesse a conta Super Admin</p>
              <div className={s.hintRow}>
                <span className={s.hintLabel}>Email</span>
                <code className={s.hintValue}>admin@intellux.com</code>
              </div>
              <div className={s.hintRow}>
                <span className={s.hintLabel}>Senha</span>
                <code className={s.hintValue}>changeme</code>
              </div>
            </div>
          )}
        </div>

        <div className={s.header}>
          <h1 className={s.title}>Intellux Drive</h1>
          <p className={s.subtitle}>Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={s.form}>
          <div className={s.field}>
            <label htmlFor="email" className={s.label}>Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              {...register('email')}
              className={s.input}
            />
            {errors.email && <span className={s.error}>{errors.email.message}</span>}
          </div>

          <div className={s.field}>
            <label htmlFor="password" className={s.label}>Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={s.input}
            />
            {errors.password && <span className={s.error}>{errors.password.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className={s.submitBtn}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
