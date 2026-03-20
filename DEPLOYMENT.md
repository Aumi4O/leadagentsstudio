# Lead Agents Studio — where things live

**TL;DR:** The **website** (HTML, CSS, SmartLine sales page) deploys on **Cloudflare Pages**. The **SmartLine API** (chat, voice tokens, tools) runs on **Render**.

| Piece | Platform | What you check after a push |
|-------|----------|-----------------------------|
| **Static site** — `leadagentsstudio.com`, subdomains (`smartline.…`, `he.…`), `/smartline/`, etc. | **Cloudflare Pages** | Cloudflare → **Pages** → your project → latest deployment |
| **Backend API** — e.g. `lead-agents-api.onrender.com` | **Render** | Render → your **web service** (not Pages) → deploy logs |

Git pushes to the repo connected to **Cloudflare Pages** update the public site. Pushes to the **separate API repo** (if different) update Render.

## Related docs

- Subdomains & custom domains on Cloudflare: `SUBDOMAIN_SETUP.md`, `smartline/SMARTLINE_DEPLOY.md`
- Wiring the in-page agent to the API: `../docs/SMARTLINE_CONNECT_INSTRUCTIONS.md` (in the parent Lead Agents Studio folder)
