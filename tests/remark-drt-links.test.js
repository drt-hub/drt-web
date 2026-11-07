// Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {rewrite} = require('../plugins/remark-drt-links');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'synced-docs-'));
fs.mkdirSync(path.join(root, 'assets'));
fs.writeFileSync(path.join(root, 'assets', 'logo.png'), '');
const published = new Set(['guides', 'connectors', 'adr', 'migration', 'cli']);
const r = (url, file = 'guides/plan.md') => rewrite(url, file, published, root);

test('a link into another published folder becomes a site route, keeping the anchor', () => {
  assert.strictEqual(r('../adr/0016-managed-destination-tables.md'), '/adr/0016-managed-destination-tables');
  assert.strictEqual(r('../connectors/s3.md#authentication'), '/connectors/s3#authentication');
  assert.strictEqual(r('alerts.md'), '/guides/alerts');
  assert.strictEqual(r('./alerts.md#on-stale'), '/guides/alerts#on-stale');
});

test('a link into an unpublished folder goes to GitHub', () => {
  assert.strictEqual(r('../llm/API_REFERENCE.md#sync-options'), 'https://github.com/drt-hub/drt/blob/main/docs/llm/API_REFERENCE.md#sync-options');
  assert.strictEqual(r('../research/extraction-memory.md'), 'https://github.com/drt-hub/drt/blob/main/docs/research/extraction-memory.md');
});

test('a link that leaves docs/ goes to the repository file on GitHub', () => {
  assert.strictEqual(r('../../ROADMAP.md#v13'), 'https://github.com/drt-hub/drt/blob/main/ROADMAP.md#v13');
  assert.strictEqual(r('../../examples/review-demo'), 'https://github.com/drt-hub/drt/blob/main/examples/review-demo');
});

test('a link to a docs/ file outside any published folder goes to GitHub', () => {
  assert.strictEqual(r('../telemetry.md'), 'https://github.com/drt-hub/drt/blob/main/docs/telemetry.md');
});

test('external links, anchors and site-absolute paths are left alone', () => {
  for (const url of ['https://example.com/x.md', 'mailto:a@b.c', '#heading', '/cli/apply', '//cdn.example.com/x']) {
    assert.strictEqual(r(url), url);
  }
});

test('an existing asset inside synced-docs stays as authored; a missing one goes to GitHub', () => {
  assert.strictEqual(r('../assets/logo.png'), '../assets/logo.png');
  assert.strictEqual(r('../integrations/dagster-drt/'), 'https://github.com/drt-hub/drt/blob/main/docs/integrations/dagster-drt/');
});
