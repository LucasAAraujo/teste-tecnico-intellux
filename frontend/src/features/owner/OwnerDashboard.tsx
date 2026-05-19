import { useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { useOwnerMetrics } from '../../hooks/useOwnerMetrics';
import { InviteUserForm } from './InviteUserForm';
import s from './OwnerDashboard.module.scss';

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
    </div>
  );
}
