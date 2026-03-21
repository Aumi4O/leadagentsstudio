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

**Agency offer (research report + $5k onboarding):** `https://smartline.leadagentsstudio.com/agency` — static file at `public/agency/index.html` in the Pages build. Assets reuse `/smartline/styles.css` and `/smartline/agent.js`.

## Hero demo video

**Mobile (Safari):** The hero uses **`/smartline/SMARTLINE_LEA_DIALOGUE_IOS.mp4`** (same origin as the site, deployed with Pages). That file is **H.264 Baseline + AAC + faststart**. iOS returns **`MEDIA_ERR_SRC_NOT_SUPPORTED` (error code 4)** if you use a **H.264 High**-only export (desktop Chrome still plays it).

Regenerate from the master file:

```bash
ffmpeg -y -i SMARTLINE_LEA_DIALOGUE_FINAL.mp4 -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -ac 2 public/smartline/SMARTLINE_LEA_DIALOGUE_IOS.mp4
```

**Optional CDN copy:** You can also host the same `_IOS.mp4` on R2 and set `src` to `https://cdn.leadagentsstudio.com/smartline/SMARTLINE_LEA_DIALOGUE_IOS.mp4` if you prefer not to ship video from Pages.

## Replace Buy Now link

Search and replace `https://buy.stripe.com/SMARTLINE_LINK` in `smartline/index.html` with your actual SmartLine Stripe Payment Link ($1,000 setup).
