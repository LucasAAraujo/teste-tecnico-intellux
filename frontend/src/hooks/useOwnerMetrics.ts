import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { organizationsService } from '../services/organizations.service';
import { invitesService } from '../services/invites.service';

export type OwnerMetrics = {
  activeMembers: number;
  pendingInvites: number;
  acceptedInvites: number;
  acceptanceRate: number;
};

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; metrics: OwnerMetrics };

export function useOwnerMetrics(refreshKey = 0): State {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!organizationId) {
      setState({ status: 'error', message: 'Organização não encontrada no token.' });
      return;
    }

    setState({ status: 'loading' });

    Promise.all([
      organizationsService.getMembers(organizationId),
      invitesService.getAll(),
    ])
      .then(([members, invites]) => {
        const now = new Date();
        const accepted = invites.filter((i) => i.acceptedAt !== null).length;
        const pending = invites.filter(
          (i) => i.acceptedAt === null && new Date(i.expiresAt) > now,
        ).length;

        setState({
          status: 'ready',
          metrics: {
            activeMembers: members.length,
            pendingInvites: pending,
            acceptedInvites: accepted,
            acceptanceRate:
              invites.length > 0 ? Math.round((accepted / invites.length) * 100) : 0,
          },
        });
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setState({ status: 'error', message: msg ?? 'Erro ao carregar métricas.' });
      });
  }, [organizationId, refreshKey]);

  return state;
}
