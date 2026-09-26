const fs = require('fs/promises');
const path = require('path');

const CONSENT_STORAGE_KEY = 'drt-analytics-consent';
const SCRIPT_FILENAME = 'drt-analytics.js';
const INSTRUMENTATION_TAG = /<script\b[^>]*\bdata-drt-demo-analytics(?=[\s=/>])/i;

function demoAnalyticsAssetUrl(baseUrl) {
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${prefix}demo/docs/assets/${SCRIPT_FILENAME}`;
}

function escapeHtmlAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function injectAnalytics(html, assetUrl, measurementId) {
  if (INSTRUMENTATION_TAG.test(html)) {
    return html;
  }

  const headEnd = html.search(/<\/head\s*>/i);
  if (headEnd === -1) {
    throw new Error('Demo page has no closing </head> tag for analytics instrumentation.');
  }

  const tag = [
    `<script data-drt-demo-analytics src="${escapeHtmlAttribute(assetUrl)}"`,
    ` data-ga4-measurement-id="${escapeHtmlAttribute(measurementId)}"></script>`,
    '',
  ].join('');
  return `${html.slice(0, headEnd)}${tag}${html.slice(headEnd)}`;
}

function demoAnalyticsRuntime() {
  return `// Generated during the Docusaurus build; do not add a measurement ID to static/demo source.
(function () {
  "use strict";

  var script = document.currentScript;
  var measurementId = script && script.getAttribute("data-ga4-measurement-id");
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  var googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(googleTag);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {anonymize_ip: true});

  function readConsent() {
    try {
      var choice = window.localStorage.getItem("${CONSENT_STORAGE_KEY}");
      return choice === "granted" || choice === "denied" ? choice : null;
    } catch (_) {
      return null;
    }
  }

  function saveConsent(choice) {
    try {
      window.localStorage.setItem("${CONSENT_STORAGE_KEY}", choice);
    } catch (_) {
      // Consent still applies for this page even when storage is unavailable.
    }
  }

  function grantAnalytics() {
    window.gtag("consent", "update", {analytics_storage: "granted"});
  }

  function showBanner() {
    if (document.getElementById("drt-demo-analytics-consent")) return;

    var style = document.createElement("style");
    style.textContent = "#drt-demo-analytics-consent{position:fixed;right:1rem;bottom:1rem;z-index:1000;max-width:38rem;padding:1rem;border:1px solid #d5d0df;border-radius:12px;background:#fff;color:#19151f;box-shadow:0 12px 32px rgb(19 17 28 / 16%);font:14px/1.5 system-ui,sans-serif}#drt-demo-analytics-consent p{margin:0 0 .75rem}#drt-demo-analytics-consent div{display:flex;justify-content:flex-end;gap:.5rem}#drt-demo-analytics-consent button{padding:.55rem .8rem;border:1px solid #6d28d9;border-radius:8px;font:600 13px/1 system-ui,sans-serif;cursor:pointer}#drt-demo-analytics-accept{color:#fff;background:#6d28d9}#drt-demo-analytics-decline{color:#4c1d95;background:transparent}@media(max-width:600px){#drt-demo-analytics-consent{right:.75rem;bottom:.75rem;left:.75rem}}";
    document.head.appendChild(style);

    var banner = document.createElement("aside");
    banner.id = "drt-demo-analytics-consent";
    banner.setAttribute("aria-label", "Analytics consent");
    var copy = document.createElement("p");
    copy.textContent = "This site uses Google Analytics to understand how visitors use our docs. Accept analytics cookies?";
    var actions = document.createElement("div");
    var decline = document.createElement("button");
    decline.id = "drt-demo-analytics-decline";
    decline.type = "button";
    decline.textContent = "Decline";
    var accept = document.createElement("button");
    accept.id = "drt-demo-analytics-accept";
    accept.type = "button";
    accept.textContent = "Accept";

    function choose(choice) {
      saveConsent(choice);
      if (choice === "granted") grantAnalytics();
      banner.remove();
      style.remove();
    }

    decline.addEventListener("click", function () { choose("denied"); });
    accept.addEventListener("click", function () { choose("granted"); });
    actions.append(decline, accept);
    banner.append(copy, actions);
    document.body.appendChild(banner);
  }

  var storedConsent = readConsent();
  if (storedConsent === "granted") {
    grantAnalytics();
  } else if (storedConsent === null) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner, {once: true});
    } else {
      showBanner();
    }
  }
})();
`;
}

async function htmlFiles(directory) {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return htmlFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : [];
    }),
  );
  return files.flat();
}

function demoAnalyticsPlugin(context, options) {
  const measurementId = options?.measurementId;

  return {
    name: 'drt-demo-analytics',
    async postBuild({outDir}) {
      if (!measurementId) return;

      const demoDir = path.join(outDir, 'demo', 'docs');
      try {
        await fs.access(demoDir);
      } catch {
        return;
      }

      const assetUrl = demoAnalyticsAssetUrl(context.siteConfig.baseUrl);
      const assetPath = path.join(demoDir, 'assets', SCRIPT_FILENAME);
      await fs.mkdir(path.dirname(assetPath), {recursive: true});
      await fs.writeFile(assetPath, demoAnalyticsRuntime());

      await Promise.all(
        (await htmlFiles(demoDir)).map(async (file) => {
          const html = await fs.readFile(file, 'utf8');
          await fs.writeFile(file, injectAnalytics(html, assetUrl, measurementId));
        }),
      );
    },
  };
}

module.exports = demoAnalyticsPlugin;
module.exports.demoAnalyticsAssetUrl = demoAnalyticsAssetUrl;
module.exports.injectAnalytics = injectAnalytics;
