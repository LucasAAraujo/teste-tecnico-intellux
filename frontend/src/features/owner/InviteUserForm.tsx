import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { invitesService } from '../../services/invites.service';
import s from './InviteUserForm.module.scss';

const schema = z.object({
  email: z.email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  onSuccess?: () => void;
};

export function InviteUserForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await invitesService.create(data.email);
      toast.success(`Convite enviado para ${data.email}`);
      reset();
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Erro ao enviar convite.');
    }
  };

  return (
    <div className={s.card}>
      <h2 className={s.title}>Convidar membro</h2>
      <p className={s.description}>
        O destinatário receberá um link para criar sua conta na organização.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={s.row}>
          <div className={s.inputWrapper}>
            <input
              type="email"
              placeholder="colaborador@empresa.com"
              {...register('email')}
              className={s.input}
            />
            {errors.email && <span className={s.error}>{errors.email.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className={s.submitBtn}>
            {isSubmitting ? 'Enviando…' : 'Enviar convite'}
          </button>
        </div>
      </form>
    </div>
  );
}
