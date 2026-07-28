import React from 'react';
import styles from './FeatureCard.module.css';

export type FeatureCardProps = {
  /** Sits in the tinted square above the title. An `<svg>` is sized to 21px. */
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
};

export default function FeatureCard({icon, title, description}: FeatureCardProps): React.ReactElement {
  return (
    <article className={styles.card}>
      <div className={styles.ic}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
