import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './index.module.css';

type Connector = {type: string; name: string};
type SsotData = {destinations: Connector[]; sources: Connector[]; version: string};

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText('pip install drt-core');
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {}
  };
  return (
    <div className={styles.install}>
      <span className={styles.prompt}>$</span>
      <span>pip install <b>drt-core</b></span>
      <button className={styles.copyBtn} onClick={onCopy} aria-label="Copy install command">
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        )}
      </button>
    </div>
  );
}

const FEATURES = [
  {t: 'Code-first, not click-first', d: <>Every sync is a YAML file you review in a PR and run with <code className={styles.code}>drt run</code>. No console, no hidden state — pipelines live in version control.</>, i: <path d="M8 6 3 12l5 6M16 6l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />},
  {t: 'Every major destination', d: <>Warehouses, data lakes, and SaaS — BigQuery, Snowflake, Postgres, Slack, Salesforce and more, all from one connector registry.</>, i: <><ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2" /><path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="currentColor" strokeWidth="2" /></>},
  {t: 'dbt-native lineage', d: <>Point a sync at a model with <code className={styles.code}>ref('users')</code>. drt reads your dbt project so activation inherits the same lineage as transformation.</>, i: <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />},
  {t: 'Built-in observability', d: <>Native OpenTelemetry traces and metrics — every run, extract, and batch is a span you can ship to any OTLP backend.</>, i: <><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>},
  {t: 'Dry-run & diff', d: <>Preview exactly which rows will be added, updated, or deleted before a single write with <code className={styles.code}>drt run --dry-run --diff</code>.</>, i: <path d="M12 3v6M12 15v6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M3 12h6M15 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />},
  {t: 'CI-native', d: <>Run syncs from GitHub Actions with structured JSON output. Schedule, gate on diffs, and treat activation like any other deploy.</>, i: <><path d="M4 4h16v5H4zM4 13h16v7H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M7 6.5h.01M7 16.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>},
];

function ConnectorGrid({items}: {items: Connector[]}) {
  return (
    <div className={styles.connGrid}>
      {items.map((c) => (
        <div className={styles.conn} key={c.type}>
          <span className={styles.swatch} />
          {c.name}
        </div>
      ))}
    </div>
  );
}

export default function Home(): React.ReactElement {
  const data = usePluginData('drt-ssot-data') as SsotData;
  const destinations = data?.destinations ?? [];
  const sources = data?.sources ?? [];

  return (
    <Layout title="Reverse ETL for the code-first data stack" description="drt is a code-first reverse ETL CLI. Sync warehouse data into the tools your team uses — defined in YAML, run from the terminal, versioned in Git.">
      <main className={styles.page}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={`${styles.wrap} ${styles.heroGrid}`}>
            <div>
              <span className={styles.eyebrow}><span className={styles.dot} />Reverse ETL · code-first</span>
              <h1 className={styles.h1}>Reverse ETL for the <span className={styles.accent}>code-first</span> data stack</h1>
              <p className={styles.sub}>Sync modeled warehouse data back into the tools your team actually uses — REST APIs, Slack, Salesforce, and more. Defined in YAML, run from the terminal, versioned in Git.</p>
              <div className={styles.ctaRow}>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/#quickstart">Get started <Arrow /></Link>
                <Link className={`${styles.btn} ${styles.btnGhost}`} to="https://github.com/drt-hub/drt">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>
                  GitHub
                </Link>
              </div>
              <CopyInstall />
              <div className={styles.lineage}>
                <span className={styles.linLabel}>pipeline</span>
                <span className={styles.chip}>dlt<small>load</small></span>
                <svg className={styles.linArrow} width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 7h16M12 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className={styles.chip}>dbt<small>transform</small></span>
                <svg className={styles.linArrow} width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 7h16M12 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className={`${styles.chip} ${styles.chipActive}`}>drt<small>activate</small></span>
              </div>
            </div>

            {/* terminal */}
            <div className={styles.terminal} aria-hidden="true">
              <div className={styles.termBar}>
                <i className={styles.dR} /><i className={styles.dY} /><i className={styles.dG} />
                <span className={styles.termTitle}>~/analytics — drt run</span>
              </div>
              <div className={styles.termBody}>
                <div className={styles.ln}><span className={styles.p}>$</span> drt init</div>
                <div className={`${styles.ln} ${styles.dim}`}>  created drt_project.yml · syncs/</div>
                <div className={styles.ln}><span className={styles.p}>$</span> drt run <span className={styles.vio}>active_users_to_slack</span></div>
                <div className={`${styles.ln} ${styles.dim}`}>  source   <span className={styles.wht}>bigquery</span>   ·  model <span className={styles.wht}>ref('active_users')</span></div>
                <div className={`${styles.ln} ${styles.dim}`}>  dest     <span className={styles.wht}>slack</span>      ·  mode  <span className={styles.wht}>incremental</span></div>
                <div className={styles.ln}>  extract  <span className={styles.ok}>2,481 rows</span></div>
                <div className={styles.ln}>  load     <span className={styles.ok}>✓ 2,481</span> <span className={styles.dim}>· failed 0 · skipped 0</span></div>
                <div className={`${styles.ln} ${styles.ok}`}>  ✓ sync complete <span className={styles.dim}>in 3.2s</span></div>
                <div className={styles.ln}>&nbsp;</div>
                <div className={styles.ln}><span className={styles.p}>$</span> <span className={styles.cursor} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section id="why" className={`${styles.section} ${styles.band}`}>
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.secEyebrow}>Why drt</span>
              <h2>The activation layer that lives in your repo</h2>
              <p>Reverse ETL without the dashboards, seat licenses, or point-and-click pipelines. If you ship with dbt and Git, drt fits the way you already work.</p>
            </div>
            <div className={styles.features}>
              {FEATURES.map((f) => (
                <article className={styles.card} key={f.t}>
                  <div className={styles.ic}><svg viewBox="0 0 24 24" fill="none">{f.i}</svg></div>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CONNECTORS */}
        <section id="connectors" className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.matrixHead}>
              <div className={styles.secHead} style={{marginBottom: 0}}>
                <span className={styles.secEyebrow}>Connectors</span>
                <h2>One registry, every destination</h2>
              </div>
              <span className={styles.genNote}>↻ generated from <b>connector manifests</b> — never hand-listed</span>
            </div>

            <div className={styles.connGroup}>
              <h4>Destinations <span className={styles.count}>{destinations.length}</span></h4>
              <ConnectorGrid items={destinations} />
            </div>
            <div className={styles.connGroup}>
              <h4>Sources <span className={styles.count}>{sources.length}</span></h4>
              <ConnectorGrid items={sources} />
            </div>
          </div>
        </section>

        {/* QUICKSTART */}
        <section id="quickstart" className={`${styles.section} ${styles.band}`}>
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.secEyebrow}>Quickstart</span>
              <h2>Your first sync in three steps</h2>
              <p>From install to activated data without leaving the terminal.</p>
            </div>
            <div className={styles.qsGrid}>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <h3>Install &amp; initialize</h3>
                  <p><code className={styles.code}>pip install drt-core</code>, then <code className={styles.code}>drt init</code> scaffolds a <code className={styles.code}>drt_project.yml</code> and a <code className={styles.code}>syncs/</code> folder.</p>
                </div>
                <div className={styles.step}>
                  <h3>Describe a sync</h3>
                  <p>Write a YAML file: point a dbt <code className={styles.code}>ref()</code> model at a destination and pick a sync mode. That's the whole config.</p>
                </div>
                <div className={styles.step}>
                  <h3>Run it</h3>
                  <p><code className={styles.code}>drt run</code> extracts, loads, and reports — or preview first with <code className={styles.code}>--dry-run --diff</code>. Wire it into CI when you're ready.</p>
                </div>
              </div>
              <div className={styles.codeCard}>
                <div className={styles.codeTab}><span className={styles.fname}>syncs/active_users_to_slack.yml</span><span className={styles.badge}>validated</span></div>
                <pre className={styles.pre}>
{`name: active_users_to_slack
`}<span className={styles.k}>model</span>{`: `}<span className={styles.s}>"ref('active_users')"</span>{`   `}<span className={styles.c}># your dbt model</span>{`

`}<span className={styles.k}>destination</span>{`:
  `}<span className={styles.k}>type</span>{`: `}<span className={styles.s}>slack</span>{`
  `}<span className={styles.k}>channel</span>{`: `}<span className={styles.s}>"#growth"</span>{`

`}<span className={styles.k}>sync</span>{`:
  `}<span className={styles.k}>mode</span>{`: `}<span className={styles.s}>incremental</span>{`
  `}<span className={styles.k}>cursor</span>{`: `}<span className={styles.s}>updated_at</span>{`
  `}<span className={styles.k}>on_error</span>{`: `}<span className={styles.s}>skip</span>{`      `}<span className={styles.c}># skip | fail</span>{`
  `}<span className={styles.k}>batch_size</span>{`: `}<span className={styles.n}>500</span>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={`${styles.section} ${styles.ctaStrip}`}>
          <div className={styles.wrap}>
            <div className={styles.ctaCard}>
              <h2>Activate your warehouse in minutes</h2>
              <p>Free and open source under Apache-2.0. Install drt and ship your first sync today.</p>
              <div className={styles.ctaRow}>
                <Link className={`${styles.btn} ${styles.btnPrimary}`} to="https://github.com/drt-hub/drt">Read the docs <Arrow /></Link>
                <Link className={`${styles.btn} ${styles.btnGhost}`} to="https://github.com/drt-hub/drt-sandbox">Try the sandbox</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
