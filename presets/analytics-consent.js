/**
 * Loads before preset-classic so Consent Mode defaults are established before
 * the Google tag and its configuration script are added to the page.
 */
function analyticsConsentPreset() {
  return {
    plugins: [
      function analyticsConsentPlugin() {
        return {
          name: 'drt-analytics-consent',
          injectHtmlTags() {
            return {
              headTags: [
                {
                  tagName: 'script',
                  innerHTML: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('consent', 'default', {
                      analytics_storage: 'denied',
                      ad_storage: 'denied',
                      ad_user_data: 'denied',
                      ad_personalization: 'denied',
                      wait_for_update: 500
                    });
                  `,
                },
              ],
            };
          },
        };
      },
    ],
  };
}

module.exports = analyticsConsentPreset;
