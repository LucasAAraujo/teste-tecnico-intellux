import { useEffect, useState } from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { useSuperAdminMetrics } from '../../hooks/useSuperAdminMetrics';
import { organizationsService } from '../../services/organizations.service';
import type { OrgPage } from '../../services/organizations.service';
import type { Organization } from '../../types';
import { InviteOwnerForm } from './InviteOwnerForm';
import s from './SuperAdminDashboard.module.scss';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

type OrgListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; page: OrgPage };

function OrgsList({ refreshKey }: { refreshKey: number }) {
  const [state, setState] = useState<OrgListState>({ status: 'loading' });
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setState({ status: 'loading' });
    organizationsService
      .getAll(page, limit)
      .then((data) => setState({ status: 'ready', page: data }))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setState({ status: 'error', message: msg ?? 'Erro ao carregar organizações.' });
      });
  }, [page, refreshKey]);

  if (state.status === 'loading') {
    return (
      <div className={s.tableWrap}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={s.skeletonRow} />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return <p className={s.errorText}>{state.message}</p>;
  }

  const { items, total, totalPages } = state.page;

  if (items.length === 0) {
    return <p className={s.emptyText}>Nenhuma organização cadastrada.</p>;
  }

  return (
    <>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th}>Nome</th>
              <th className={s.th}>Criada em</th>
            </tr>
          </thead>
          <tbody>
            {items.map((org: Organization) => (
              <tr key={org.id} className={s.tr}>
                <td className={s.td}>{org.name}</td>
                <td className={s.tdMuted}>{formatDate(org.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button
            className={s.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className={s.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            ›
          </button>

          <span className={s.pageInfo}>{total} organização{total !== 1 ? 'ões' : ''}</span>
        </div>
      )}
    </>
  );
}

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
        <h2 className={s.sectionTitle}>Organizações</h2>
        <OrgsList refreshKey={refreshKey} />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Novo convite</h2>
        <InviteOwnerForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </section>
    </div>
  );
}
