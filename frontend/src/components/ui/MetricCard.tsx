import s from './MetricCard.module.scss';

type Props = {
  label: string;
  value: string | number;
  description?: string;
};

export function MetricCard({ label, value, description }: Props) {
  return (
    <div className={s.card}>
      <p className={s.label}>{label}</p>
      <p className={s.value}>{value}</p>
      {description && <p className={s.description}>{description}</p>}
    </div>
  );
}
