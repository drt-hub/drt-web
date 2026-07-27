import React from 'react';
import styles from './CodeWindow.module.css';

/**
 * `terminal` — traffic-light chrome over a transcript; children are lines.
 * `file`     — filename tab over a `<pre>`; children are the snippet.
 */
export type CodeWindowVariant = 'terminal' | 'file';

export type CodeWindowProps = {
  variant?: CodeWindowVariant;
  /** Header label — a path for `file`, a shell prompt for `terminal`. */
  title?: React.ReactNode;
  /** Right-aligned header slot: status badges today, a copy button later. */
  actions?: React.ReactNode;
  /** The window body — transcript lines for `terminal`, a snippet for `file`. */
  children: React.ReactNode;
  /** Set when the window is decorative and duplicated by nearby prose. */
  'aria-hidden'?: boolean;
};

export default function CodeWindow({
  variant = 'file',
  title,
  actions,
  children,
  'aria-hidden': ariaHidden,
}: CodeWindowProps): React.ReactElement {
  const isTerminal = variant === 'terminal';
  const Body = isTerminal ? 'div' : 'pre';

  return (
    <div
      className={`${styles.window} ${isTerminal ? styles.terminal : styles.file}`}
      aria-hidden={ariaHidden}
    >
      {(isTerminal || title || actions) && (
        <div className={`${styles.header} ${isTerminal ? styles.headerTerminal : styles.headerFile}`}>
          {isTerminal && (
            <>
              <i className={`${styles.dot} ${styles.dotRed}`} />
              <i className={`${styles.dot} ${styles.dotYellow}`} />
              <i className={`${styles.dot} ${styles.dotGreen}`} />
            </>
          )}
          {title && <span className={isTerminal ? styles.titleTerminal : styles.titleFile}>{title}</span>}
          {actions}
        </div>
      )}
      <Body className={isTerminal ? styles.bodyTerminal : styles.bodyFile}>{children}</Body>
    </div>
  );
}
