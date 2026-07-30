import React from 'react';
import styles from './StatsGrid.module.css';

export type Stat = {
  /** Caption under the figure, e.g. "Destinations". */
  label: string;
  /** The figure itself — a count or a version, always from generated metadata. */
  value: string | number;
};

export type StatsGridProps = {
  items: Stat[];
};

/**
 * Presentational only: the caller supplies the figures, so the single source of
 * truth stays wherever the data does. Rendered as a description list — the
 * label is the term and reads first, while CSS puts the figure on top.
 */
export default function StatsGrid({items}: StatsGridProps): React.ReactElement {
  return (
    <dl className={styles.grid}>
      {items.map((s) => (
        <div className={styles.stat} key={s.label}>
          <dt className={styles.label}>{s.label}</dt>
          <dd className={styles.value}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
