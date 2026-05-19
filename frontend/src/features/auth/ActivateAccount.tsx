import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { invitesService } from '../../services/invites.service';
import { InviteRole, type InviteValidation } from '../../types';

type Status = 'loading' | 'error' | 'form' | 'success';

const makeSchema = (isOwner: boolean) =>
  z
    .object({
      name: z.string().min(2, 'Nome obrigatório'),
      orgName: isOwner
        ? z.string().min(2, 'Nome da organização obrigatório')
        : z.string().optional(),
      password: z.string().min(8, 'Mínimo 8 caracteres'),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: 'Senhas não conferem',
      path: ['confirmPassword'],
    });

type FormData = {
  name: string;
  orgName?: string;
  password: string;
  confirmPassword: string;
};

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
  const schema = makeSchema(isOwner);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Validando convite…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Convite inválido</h2>
            <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-violet-600 hover:underline cursor-pointer"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Conta criada!</h2>
            <p className="text-sm text-gray-500">Redirecionando para o login…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Ativar conta
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Convite para{' '}
              <span className="font-medium text-gray-700">{invite?.email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                {...register('name')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {isOwner && (
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Nome da organização
                </label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="Minha Empresa"
                  {...register('orgName')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
                {errors.orgName && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.orgName.message}</p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
