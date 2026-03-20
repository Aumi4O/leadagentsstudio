# SmartLine subdomain setup (smartline.leadagentsstudio.com)

**Remember:** **Cloudflare** = this marketing site. **Render** = the API (`lead-agents-api…`), not the HTML. See also `../DEPLOYMENT.md`.

## Where the site actually deploys

| What | Host | Where to check deploys |
|------|------|-------------------------|
| **Static site** (`leadagentsstudio.com`, `smartline.leadagentsstudio.com`, `/smartline/`) | **Cloudflare Pages** (CDN: `server: cloudflare` in HTTP headers) | Cloudflare Dashboard → **Pages** → project connected to `Aumi4O/leadagentsstudio` (or your repo) |
| **SmartLine API** (chat/voice tokens, tools) | **Render** | Render Dashboard → service **`lead-agents-api`** (e.g. `lead-agents-api.onrender.com`) |

Pushes to GitHub only update the live **sales page** if **Cloudflare Pages** is connected to that repo/branch. You will **not** see those static-site builds under Render — only the API service appears there.

## Setup steps

1. **Cloudflare Dashboard** → Your domain → **Pages** → your project (leadagentsstudio)
2. **Custom domains** → **Set up a custom domain**
3. Add: `smartline.leadagentsstudio.com`
4. Cloudflare adds DNS and SSL automatically

When visitors go to smartline.leadagentsstudio.com, the main index redirects them to `/smartline/` (same subdomain). The SmartLine sales page loads.

## Replace Buy Now link

Search and replace `https://buy.stripe.com/SMARTLINE_LINK` in `smartline/index.html` with your actual SmartLine Stripe Payment Link ($1,000 setup).
