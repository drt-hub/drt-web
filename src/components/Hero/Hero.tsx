import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Hero.module.css';

/** A hero call-to-action. `label` is a node so callers can inline an icon. */
export type HeroCta = {
  label: React.ReactNode;
  /** Internal route, in-page hash, or absolute URL — resolved by Docusaurus `Link`. */
  href: string;
};

export type HeroProps = {
  /** Pill above the title. The leading dot is drawn by the component. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  /**
   * Second column — terminal preview, illustration, screenshot. Omit for a
   * single-column hero.
   */
  aside?: React.ReactNode;
  /** Extra content below the CTAs, in the text column. */
  children?: React.ReactNode;
};

export default function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  aside,
  children,
}: HeroProps): React.ReactElement {
  return (
    <section className={styles.hero}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div>
          {eyebrow && <span className={styles.eyebrow}><span className={styles.dot} />{eyebrow}</span>}
          <h1 className={styles.h1}>{title}</h1>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
          {(primaryCta || secondaryCta) && (
            <div className={styles.ctaRow}>
              {primaryCta && (
                <Link className={`${styles.btn} ${styles.btnPrimary}`} to={primaryCta.href}>{primaryCta.label}</Link>
              )}
              {secondaryCta && (
                <Link className={`${styles.btn} ${styles.btnGhost}`} to={secondaryCta.href}>{secondaryCta.label}</Link>
              )}
            </div>
          )}
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
