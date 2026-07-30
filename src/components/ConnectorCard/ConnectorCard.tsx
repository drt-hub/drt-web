import React from 'react';
import styles from './ConnectorCard.module.css';

export type ConnectorCardProps = {
  /** Connector display name, straight from the generated connector manifests. */
  name: React.ReactNode;
};

export default function ConnectorCard({name}: ConnectorCardProps): React.ReactElement {
  return (
    <div className={styles.card}>
      <span className={styles.swatch} />
      {name}
    </div>
  );
}
