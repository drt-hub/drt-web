// Rewrites links in the docs synced from drt-hub/drt (#95).
//
// The docs are authored in the drt repository, where a relative link resolves against
// drt's tree (`../adr/0016-....md`, `../llm/API_REFERENCE.md`, `../../examples/x`, a
// repo-root `ROADMAP.md`). On this site each published folder is its own docs instance,
// so those links need one of two targets:
//
//   - a file in a folder this site publishes -> the site route of that page
//   - anything else (unpublished folder, or a file outside docs/)  -> its GitHub URL
//
// The drt tree stays the single source of truth: nothing is rewritten on disk.
const fs = require('fs');
const path = require('path');

const GITHUB = 'https://github.com/drt-hub/drt/blob/main/';

function isExternal(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url.startsWith('/');
}

function rewrite(url, relFile, published, root) {
  if (!url || isExternal(url)) return url;
  const [target, ...rest] = url.split('#');
  const hash = rest.length ? '#' + rest.join('#') : '';
  if (!/\.mdx?$/i.test(target)) {
    // Not a page: images and other assets stay as authored when they live inside synced-docs/.
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relFile), target));
    if (!resolved.startsWith('..') && fs.existsSync(path.join(root, resolved))) return url;
    return GITHUB + path.posix.normalize(path.posix.join('docs', resolved)) + hash;
  }
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relFile), target));
  if (resolved.startsWith('..')) {
    // Outside docs/: a repo-root file such as ROADMAP.md or examples/....
    return GITHUB + path.posix.normalize(path.posix.join('docs', resolved)) + hash;
  }
  const folder = resolved.split('/')[0];
  if (resolved.includes('/') && published.has(folder)) {
    const noExt = resolved.replace(/\.mdx?$/i, '');
    const base = path.posix.basename(noExt);
    const route = base === 'README' || base === 'index' ? path.posix.dirname(noExt) : noExt;
    return '/' + route + hash;
  }
  return GITHUB + 'docs/' + resolved + hash;
}

function walk(node, visit) {
  visit(node);
  if (node.children) node.children.forEach((child) => walk(child, visit));
}

module.exports = function remarkDrtLinks(options = {}) {
  const root = path.resolve(options.root);
  const published = new Set(options.published || []);
  return (tree, file) => {
    const relFile = path.relative(root, file.path).split(path.sep).join('/');
    if (relFile.startsWith('..')) return;
    walk(tree, (node) => {
      if (node.type === 'link' || node.type === 'definition') {
        node.url = rewrite(node.url, relFile, published, root);
      }
    });
  };
};

module.exports.rewrite = rewrite; // exported for tests
