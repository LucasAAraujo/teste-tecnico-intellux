import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { invitesService } from '../../services/invites.service';
import { InviteRole, type InviteValidation } from '../../types';
import s from './ActivateAccount.module.scss';

type Status = 'loading' | 'error' | 'form' | 'success';

// orgName is always optional in the schema type — conditional validation happens in onSubmit
const formSchema = z
  .object({
    name: z.string().min(2, 'Nome obrigatório'),
    orgName: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

export function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [invite, setInvite] = useState<InviteValidation | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Token não encontrado na URL.');
      setStatus('error');
      return;
    }
    invitesService
      .validate(token)
      .then((data) => {
        setInvite(data);
        setStatus('form');
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setErrorMessage(msg ?? 'Convite inválido ou expirado.');
        setStatus('error');
      });
  }, [token]);

  const isOwner = invite?.role === InviteRole.OWNER;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: FormData) => {
    if (isOwner && !data.orgName?.trim()) {
      setError('orgName', { message: 'Nome da organização obrigatório' });
      return;
    }
    try {
      await invitesService.activate({
        token,
        name: data.name,
        password: data.password,
        orgName: isOwner ? data.orgName : undefined,
      });
      setStatus('success');
      toast.success('Conta criada com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Erro ao ativar conta. Tente novamente.');
    }
  };

  if (status === 'loading') {
    return (
      <div className={s.page}>
        <p className={s.loadingText}>Validando convite…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={s.page}>
        <div className={s.card} style={{ textAlign: 'center' }}>
          <p className={s.icon}>⚠️</p>
          <h2 className={s.errorTitle}>Convite inválido</h2>
          <p className={s.errorMessage}>{errorMessage}</p>
          <button onClick={() => navigate('/login')} className={s.backLink}>
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={s.page}>
        <div className={s.card} style={{ textAlign: 'center' }}>
          <p className={s.icon}>✓</p>
          <h2 className={s.successTitle}>Conta criada!</h2>
          <p className={s.successDesc}>Redirecionando para o login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.header}>
          <h1 className={s.title}>Ativar conta</h1>
          <p className={s.subtitle}>
            Convite para <strong>{invite?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={s.form}>
          <div className={s.field}>
            <label htmlFor="name" className={s.label}>Nome completo</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              {...register('name')}
              className={s.input}
            />
            {errors.name && <span className={s.error}>{errors.name.message}</span>}
          </div>

          {isOwner && (
            <div className={s.field}>
              <label htmlFor="orgName" className={s.label}>Nome da organização</label>
              <input
                id="orgName"
                type="text"
                placeholder="Minha Empresa"
                {...register('orgName')}
                className={s.input}
              />
              {errors.orgName && <span className={s.error}>{errors.orgName.message}</span>}
            </div>
          )}

          <div className={s.field}>
            <label htmlFor="password" className={s.label}>Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
              className={s.input}
            />
            {errors.password && <span className={s.error}>{errors.password.message}</span>}
          </div>

          <div className={s.field}>
            <label htmlFor="confirmPassword" className={s.label}>Confirmar senha</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={s.input}
            />
            {errors.confirmPassword && (
              <span className={s.error}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={s.submitBtn}>
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
