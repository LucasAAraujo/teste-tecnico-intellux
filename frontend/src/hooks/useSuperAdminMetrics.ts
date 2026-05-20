import { useEffect, useState } from 'react';
import { organizationsService } from '../services/organizations.service';
import { invitesService } from '../services/invites.service';

export type SuperAdminMetrics = {
  totalOrgs: number;
  totalInvites: number;
  acceptedInvites: number;
  acceptanceRate: number;
};

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; metrics: SuperAdminMetrics };

export function useSuperAdminMetrics(refreshKey = 0): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    Promise.all([organizationsService.getAll(), invitesService.getAll()])
      .then(([orgs, invites]) => {
        const accepted = invites.filter((i) => i.acceptedAt !== null).length;
        setState({
          status: 'ready',
          metrics: {
            totalOrgs: orgs.total,
            totalInvites: invites.length,
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
  }, [refreshKey]);

  return state;
}
