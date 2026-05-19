import { useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { useSuperAdminMetrics } from '../../hooks/useSuperAdminMetrics';
import { InviteOwnerForm } from './InviteOwnerForm';
import s from './SuperAdminDashboard.module.scss';

export function SuperAdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const metricsState = useSuperAdminMetrics(refreshKey);

  return (
    <div>
      <section className={s.section}>
        <h2 className={s.sectionTitle}>Métricas globais</h2>

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
              label="Organizações"
              value={metricsState.metrics.totalOrgs}
              description="cadastradas"
            />
            <MetricCard
              label="Convites enviados"
              value={metricsState.metrics.totalInvites}
              description="total acumulado"
            />
            <MetricCard
              label="Contas ativadas"
              value={metricsState.metrics.acceptedInvites}
              description="convites aceitos"
            />
            <MetricCard
              label="Taxa de aceite"
              value={`${metricsState.metrics.acceptanceRate}%`}
              description={
                metricsState.metrics.totalInvites === 0
                  ? 'sem convites ainda'
                  : `${metricsState.metrics.acceptedInvites} de ${metricsState.metrics.totalInvites}`
              }
            />
          </div>
        )}
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Novo convite</h2>
        <InviteOwnerForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </section>
    </div>
  );
}
