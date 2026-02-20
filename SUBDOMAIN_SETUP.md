# Hebrew Subdomain Setup (he.leadagentsstudio.com)

The site has two "versions" served from the same deploy:

- **Main domain** (leadagentsstudio.com): USA version — Hebrew and Israeli flag are hidden
- **Hebrew subdomain** (he.leadagentsstudio.com): Full version with Hebrew/Israeli option visible

## Add the Hebrew subdomain in Cloudflare

1. Go to **Cloudflare Dashboard** → Your domain → **Pages** → your project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `he.leadagentsstudio.com`
5. Cloudflare will add the DNS record and SSL automatically

Both domains serve the same build. JavaScript shows/hides the Hebrew button based on hostname.
