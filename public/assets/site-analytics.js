/**
 * Lead Agents Studio — Google Analytics 4 + Microsoft Clarity
 *
 * Add once in <head> (early, after charset/viewport if possible):
 *   <script src="/assets/site-analytics.js"></script>
 *
 * Safe if included twice (second run no-ops). IDs match existing site tags.
 */
(function () {
  if (window.__LAS_ANALYTICS__) return;
  window.__LAS_ANALYTICS__ = true;

  var GA_MEASUREMENT_ID = 'G-VX7SKYTQWP';
  var CLARITY_ID = 'vxpozw715x';

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  var g = document.createElement('script');
  g.async = true;
  g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(g);

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
})();
