import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import structure from '@site/docs-structure.json';
import styles from './styles.module.css';

type Group = {label: string; blurb?: string; items: string[]};
type Section = {title: string; intro: string; groups?: Group[]};

// 'column-contracts' -> 'Column contracts'; 'rest-api' -> 'REST API' style acronyms are kept
// readable by the pages' own titles in the sidebar, so this is only the index's short label.
const ACRONYMS: Record<string, string> = {
  api: 'API', sqs: 'SQS', gcs: 'GCS', s3: 'S3', smtp: 'SMTP', dbt: 'dbt', ci: 'CI', cd: 'CD',
  pii: 'PII', sql: 'SQL', mysql: 'MySQL', sqlserver: 'SQL Server', hubspot: 'HubSpot',
  bigquery: 'BigQuery', clickhouse: 'ClickHouse', duckdb: 'DuckDB', sqlite: 'SQLite',
  github: 'GitHub', pipedrive: 'Pipedrive', postgres: 'PostgreSQL', adr: 'ADR',
};
const OVERRIDES: Record<string, string> = {
  'ci-cd-integration': 'CI/CD integration',
  'using-with-dbt': 'Using drt with dbt',
  'using-with-airflow': 'Using drt with Airflow',
  'using-with-prefect': 'Using drt with Prefect',
  'using-webhook-trigger': 'Using the webhook trigger',
  'rest-api': 'REST API',
  'azure-blob': 'Azure Blob Storage',
  'google-sheets': 'Google Sheets',
  'google-ads': 'Google Ads',
  'meta-conversions': 'Meta Conversions API',
  'salesforce-bulk': 'Salesforce Bulk',
  'email-smtp': 'Email (SMTP)',
  'github-actions': 'GitHub Actions',
  'staged-upload': 'Staged upload',
  deltalake: 'Delta Lake',
  iceberg: 'Apache Iceberg',
};
function humanize(id: string): string {
  if (OVERRIDES[id]) return OVERRIDES[id];
  const words = id.split('-').map((w) => ACRONYMS[w] ?? w);
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function DocsSectionIndex({id}: {id: string}): React.ReactElement {
  const section = (structure as Record<string, Section>)[id];
  return (
    <Layout title={section.title} description={section.intro}>
      <main className={`container margin-vert--lg ${styles.wrap}`}>
        <h1>{section.title}</h1>
        <p className={styles.intro}>{section.intro}</p>
        {section.groups?.map((group) => (
          <section key={group.label} className={styles.group}>
            <h2>{group.label}</h2>
            {group.blurb ? <p className={styles.blurb}>{group.blurb}</p> : null}
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item}>
                  <Link to={`/${id}/${item}`}>{humanize(item)}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </Layout>
  );
}
