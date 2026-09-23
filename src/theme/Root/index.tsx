import React, {type ReactNode, useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

const CONSENT_STORAGE_KEY = 'drt-analytics-consent';

type ConsentChoice = 'granted' | 'denied';

function updateAnalyticsConsent() {
  const gtag = (window as Window & {gtag?: (...args: unknown[]) => void}).gtag;
  gtag?.('consent', 'update', {analytics_storage: 'granted'});
}

function readStoredConsent(): ConsentChoice | null {
  try {
    const choice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return choice === 'granted' || choice === 'denied' ? choice : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Consent still applies for this page even when storage is unavailable.
  }
}

function AnalyticsConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = readStoredConsent();

    if (storedConsent === 'granted') {
      updateAnalyticsConsent();
    } else if (storedConsent === null) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const chooseConsent = (choice: ConsentChoice) => {
    storeConsent(choice);
    if (choice === 'granted') {
      updateAnalyticsConsent();
    }
    setIsVisible(false);
  };

  return (
    <aside className={styles.banner} aria-label="Analytics consent">
      <p className={styles.copy}>
        This site uses Google Analytics to understand how visitors use our docs. Accept analytics cookies?
      </p>
      <div className={styles.actions}>
        <button className={styles.declineButton} type="button" onClick={() => chooseConsent('denied')}>
          Decline
        </button>
        <button className={styles.acceptButton} type="button" onClick={() => chooseConsent('granted')}>
          Accept
        </button>
      </div>
    </aside>
  );
}

export default function Root({children}: {children: ReactNode}) {
  const {siteConfig} = useDocusaurusContext();
  const analyticsEnabled = siteConfig.customFields?.analyticsEnabled === true;

  return (
    <>
      {children}
      {analyticsEnabled ? <AnalyticsConsentBanner /> : null}
    </>
  );
}
