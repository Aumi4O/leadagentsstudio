# SmartLine subdomain setup (smartline.leadagentsstudio.com)

## Setup steps

1. **Cloudflare Dashboard** → Your domain → **Pages** → your project (leadagentsstudio)
2. **Custom domains** → **Set up a custom domain**
3. Add: `smartline.leadagentsstudio.com`
4. Cloudflare adds DNS and SSL automatically

When visitors go to smartline.leadagentsstudio.com, the main index redirects them to `/smartline/` (same subdomain). The SmartLine sales page loads.

## Replace Buy Now link

Search and replace `https://buy.stripe.com/SMARTLINE_LINK` in `smartline/index.html` with your actual SmartLine Stripe Payment Link ($1,000 setup).
