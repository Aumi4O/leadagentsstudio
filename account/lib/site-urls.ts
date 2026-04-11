/**
 * Shared URLs used across static marketing pages in this repo
 * (see index.html, smartline, public/assets/site-footer.js, etc.)
 */
export const SITE_CALENDLY_URL = "https://calendly.com/aumi4-support/30min"

/** Default survey thank-you / discount code when NEXT_PUBLIC_SURVEY_OFFER_CODE is unset */
export const SITE_SURVEY_THANK_YOU_CODE = "SURVEY10"

/** Discount percentage shown on the thank-you page */
export const SITE_SURVEY_DISCOUNT_PERCENT = 10

/**
 * Main marketing site (Cloudflare Pages). Override at build time if your domain differs.
 */
export const SITE_MARKETING_BASE =
  (process.env.NEXT_PUBLIC_SITE_MARKETING_BASE ?? "").trim().replace(/\/$/, "") ||
  "https://leadagentsstudio.com"

/** “Claim offer” button when NEXT_PUBLIC_SURVEY_OFFER_URL is unset */
export const SITE_SURVEY_OFFER_FALLBACK = `${SITE_MARKETING_BASE}/`

/** Context link targets when vertical-specific NEXT_PUBLIC_* URLs are unset */
export function siteDefaultContextUrl(
  pathKey: "demo" | "page" | "portfolio"
): string {
  switch (pathKey) {
    case "page":
      return `${SITE_MARKETING_BASE}/en/`
    case "portfolio":
      return `${SITE_MARKETING_BASE}/smartline/`
    default:
      return `${SITE_MARKETING_BASE}/`
  }
}
