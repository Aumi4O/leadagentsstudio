/**
 * Injects the global site footer. Add before </body>:
 * <div id="las-site-footer-mount"></div>
 * <script src="/assets/site-footer.js" defer></script>
 */
(function () {
  var mount = document.getElementById('las-site-footer-mount');
  if (!mount) return;

  var html =
    '<footer class="las-site-footer" role="contentinfo">' +
    '<div class="las-site-footer__inner">' +
    '<div class="las-site-footer__brand">Lead Agents Studio</div>' +
    '<div class="las-site-footer__contact">' +
    '<a href="mailto:support@smartlineagents.com">support@smartlineagents.com</a>' +
    '<a href="https://calendly.com/aumi4-support/30min" target="_blank" rel="noopener noreferrer" data-las-accent="1">Book a call</a>' +
    '</div>' +
    '<nav class="las-site-footer__nav" aria-label="Site pages">' +
    '<a href="/">Home</a>' +
    '<a href="/about.html">About</a>' +
    '<a href="/ai-creative-offer.html">AI Creative offers</a>' +
    '<a href="/ugc/">Full walkthrough (EN)</a>' +
    '<a href="https://aifashionartists.com" target="_blank" rel="noopener noreferrer">AI Fashion Artists</a>' +
    '<a href="/smartline/">SmartLine</a>' +
    '<a href="/smartline/real-estate.html">SmartLine — Real estate</a>' +
    '<a href="https://smartline.leadagentsstudio.com/agency/">Agency</a>' +
    '</nav>' +
    '<nav class="las-site-footer__policies" aria-label="Legal policies">' +
    '<span class="las-site-footer__label">Policies</span>' +
    '<a href="/privacy.html">Privacy</a>' +
    '<a href="/terms.html">Terms</a>' +
    '<a href="/billing.html">Billing</a>' +
    '<a href="/refund.html">Refund</a>' +
    '</nav>' +
    '<p class="las-site-footer__copy">© 2026 Olga Vasilevsky · AUMI 4 · Lead Agents Studio</p>' +
    '</div>' +
    '</footer>';

  mount.outerHTML = html;
})();
