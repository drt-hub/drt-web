const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const demoAnalyticsPlugin = require('../plugins/demo-analytics');

test('instruments every built demo page with the shared consent-aware GA4 runtime', async (t) => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'drt-demo-analytics-'));
  t.after(() => fs.rm(outDir, {recursive: true, force: true}));

  const demoDir = path.join(outDir, 'demo', 'docs');
  await fs.mkdir(path.join(demoDir, 'sync'), {recursive: true});
  await fs.writeFile(path.join(demoDir, 'index.html'), '<html><head></head><body>index</body></html>');
  await fs.writeFile(
    path.join(demoDir, 'sync', 'users.html'),
    '<html><head></head><body>users</body></html>',
  );

  const plugin = demoAnalyticsPlugin(
    {siteConfig: {baseUrl: '/drt-web/'}},
    {measurementId: 'G-TESTTESTTEST'},
  );
  await plugin.postBuild({outDir});

  for (const relativePath of ['index.html', 'sync/users.html']) {
    const page = await fs.readFile(path.join(demoDir, relativePath), 'utf8');
    assert.match(
      page,
      /src="\/drt-web\/demo\/docs\/assets\/drt-analytics\.js" data-ga4-measurement-id="G-TESTTESTTEST"/,
    );
  }

  const runtime = await fs.readFile(path.join(demoDir, 'assets', 'drt-analytics.js'), 'utf8');
  assert.match(runtime, /drt-analytics-consent/);
  assert.match(runtime, /analytics_storage: "denied"/);
  assert.match(runtime, /analytics_storage: "granted"/);

  await plugin.postBuild({outDir});
  const page = await fs.readFile(path.join(demoDir, 'index.html'), 'utf8');
  assert.equal((page.match(/data-drt-demo-analytics/g) || []).length, 1);
});

test('leaves a page that was already instrumented unchanged', () => {
  const page = '<html><head><script data-drt-demo-analytics></script></head><body></body></html>';
  assert.equal(
    demoAnalyticsPlugin.injectAnalytics(page, '/drt-web/demo/docs/assets/drt-analytics.js', 'G-TEST'),
    page,
  );
});

test('does not mistake documentation text for an injected analytics script', () => {
  const page = '<html><head></head><body><code>data-drt-demo-analytics</code></body></html>';
  const instrumented = demoAnalyticsPlugin.injectAnalytics(
    page,
    '/drt-web/demo/docs/assets/drt-analytics.js',
    'G-TEST',
  );

  assert.match(instrumented, /<script data-drt-demo-analytics /);
  assert.match(instrumented, /<code>data-drt-demo-analytics<\/code>/);
});
