import { useEffect, useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { useOwnerMetrics } from '../../hooks/useOwnerMetrics';
import { organizationsService } from '../../services/organizations.service';
import { useAuthStore } from '../../store/auth.store';
import type { Member } from '../../types';
import { UserRole } from '../../types';
import { InviteUserForm } from './InviteUserForm';
import s from './OwnerDashboard.module.scss';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

const ROLE_LABEL: Record<string, string> = {
  [UserRole.OWNER]: 'Owner',
  [UserRole.USER]: 'Usuário',
};

type MembersListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; members: Member[] };

function MembersList({ refreshKey }: { refreshKey: number }) {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [state, setState] = useState<MembersListState>({ status: 'loading' });

  useEffect(() => {
    if (!organizationId) return;
    setState({ status: 'loading' });
    organizationsService
      .getMembers(organizationId)
      .then((data) => setState({ status: 'ready', members: data }))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setState({ status: 'error', message: msg ?? 'Erro ao carregar membros.' });
      });
  }, [organizationId, refreshKey]);

  if (state.status === 'loading') {
    return (
      <div className={s.tableWrap}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={s.skeletonRow} />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return <p className={s.errorText}>{state.message}</p>;
  }

  if (state.members.length === 0) {
    return <p className={s.emptyText}>Nenhum membro cadastrado.</p>;
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.th}>Nome</th>
            <th className={s.th}>E-mail</th>
            <th className={s.th}>Perfil</th>
            <th className={s.th}>Desde</th>
          </tr>
        </thead>
        <tbody>
          {state.members.map((m: Member) => (
            <tr key={m.id} className={s.tr}>
              <td className={s.td}>{m.name}</td>
              <td className={s.tdMuted}>{m.email}</td>
              <td className={s.tdMuted}>{ROLE_LABEL[m.role] ?? m.role}</td>
              <td className={s.tdMuted}>{formatDate(m.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OwnerDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const metricsState = useOwnerMetrics(refreshKey);

  return (
    <div>
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Métricas da organização</h2>

        {metricsState.status === 'loading' && (
          <div className={s.metricsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={s.skeletonCard} />
            ))}
          </div>
        )}

        {metricsState.status === 'error' && (
          <p className={s.errorText}>{metricsState.message}</p>
        )}

        {metricsState.status === 'ready' && (
          <div className={s.metricsGrid}>
            <MetricCard
              label="Membros ativos"
              value={metricsState.metrics.activeMembers}
              description="na organização"
            />
            <MetricCard
              label="Convites pendentes"
              value={metricsState.metrics.pendingInvites}
              description="aguardando aceite"
            />
            <MetricCard
              label="Convites aceitos"
              value={metricsState.metrics.acceptedInvites}
              description="contas criadas"
            />
            <MetricCard
              label="Taxa de aceite"
              value={`${metricsState.metrics.acceptanceRate}%`}
              description={
                metricsState.metrics.acceptedInvites + metricsState.metrics.pendingInvites === 0
                  ? 'sem convites ainda'
                  : `${metricsState.metrics.acceptedInvites} de ${
                      metricsState.metrics.acceptedInvites + metricsState.metrics.pendingInvites
                    }`
              }
            />
          </div>
        )}
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Novo convite</h2>
        <InviteUserForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Membros</h2>
        <MembersList refreshKey={refreshKey} />
      </section>
    </div>
  );
}
