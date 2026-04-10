# Lead Agents Studio — where things live

**TL;DR:** The **website** (HTML, CSS, SmartLine sales page) deploys on **Cloudflare Pages**. The **SmartLine API** (chat, voice tokens, tools) runs on **Render**.

| Piece | Platform | What you check after a push |
|-------|----------|-----------------------------|
| **Static site** — `leadagentsstudio.com`, subdomains (`smartline.…`, `he.…`), `/smartline/`, etc. | **Cloudflare Pages** | Cloudflare → **Pages** → your project → latest deployment |
| **Backend API** — e.g. `lead-agents-api.onrender.com` | **Render** | Render → your **web service** (not Pages) → deploy logs |
| **Account app + Quick Fit survey** — Next.js in `account/` | **Render** (often **Ungrouped services**, not inside “My project”) | Public survey URL: `https://<your-service>.onrender.com/survey` — e.g. **`lead-agents-survey`** |

Git pushes to the repo connected to **Cloudflare Pages** update the public site. Pushes to the **separate API repo** (if different) update Render.

## Account app & survey on Render

The **Quick Fit Check** survey (`/survey`) and **`POST /api/survey/progress`** run inside the Next.js **`account`** app. For them to work for everyone, deploy that app as a **Render Web Service** (not static).

1. **Blueprint (optional):** Repo root includes `render.yaml` with `rootDir: account`. In Render: **New → Blueprint** and connect this repo, or create a **Web Service** manually with root directory **`account`**, build **`npm install && npm run build`**, start **`npm run start`**.
2. **Health check:** Set path to **`/api/health`** (returns JSON `{"ok":true}`).
3. **Public survey link:** Use your Render URL, e.g. `https://lead-agents-studio-account.onrender.com/survey`. Link to it from Cloudflare Pages, emails, or ads (absolute URL). The browser must call the **same host** for `/api/survey/progress` (no cross-origin setup needed).
4. **Environment variables on Render** (Dashboard → your web service → **Environment**):

| Variable | Required for survey → Notion | Notes |
|----------|-------------------------------|--------|
| `NOTION_INTERNAL_TOKEN` | Yes | Notion integration **Internal** secret |
| `NOTION_SURVEY_DATABASE_ID` | Yes | Survey database ID (see below; not the same as your generic “leads” database) |
| `NEXT_PUBLIC_CALENDLY_URL` | No | Thank-you “Book” button |
| `NEXT_PUBLIC_SURVEY_OFFER_URL` | No | Thank-you “THANKYOU offer” button |
| `NEXT_PUBLIC_SURVEY_DEMO_URL` | No | Context link (default verticals) |
| `NEXT_PUBLIC_SURVEY_AGENCY_PAGE_URL` | No | Agency vertical context link |
| `NEXT_PUBLIC_SURVEY_PORTFOLIO_URL` | No | Creative vertical context link |
| `NEXTAUTH_URL` | If you use auth | Must be `https://your-service.onrender.com` |
| `AUTH_SECRET` | If you use auth | Strong random string |
| `DATABASE_URL` | If you use Prisma/auth DB | Postgres (e.g. Render Postgres) |

`NEXT_PUBLIC_*` values are baked in at **build** time. After changing them on Render, trigger a **manual deploy** (clear build cache if needed) so the thank-you links update.

**Create the survey database in Notion:** The app expects properties **Name, Session ID, Progress, Last step, Q1–Q9, Tags** (see `account/lib/notion-survey.ts`). Your existing lead page with Email / Lead ID / Channel is a different shape.

**Internal integrations** cannot create a database at workspace root; Notion requires a **parent page** that is connected to the integration. Create a page (e.g. “Quick Fit — data”), **⋯ → Connect to → Lead Agents Studio**, then from `account/` run:

`NOTION_INTERNAL_TOKEN=… NOTION_PARENT_PAGE_ID="<Copy link from that page>" node scripts/create-notion-survey-database.mjs`

Copy the printed database ID into `NOTION_SURVEY_DATABASE_ID` on Render. Open the **new database** in Notion → **Connections** and add the same integration so the live app can write rows.

**zsh:** the `\` at end of a line must be the last character (no space after it).

### Black terminal: “APPLICATION LOADING” / “SERVICE WAKING UP”

On **Render’s free tier**, the web service **spins down** when idle. The **first** visit after that shows Render’s **loading terminal** (not your Next.js page) while the instance **allocates compute, starts Node, and runs `next start`**. That can take **~30–90+ seconds**. When the app is up, the same URL (`…/survey`) shows the real survey — **wait and refresh**, or open **Render → Logs** and confirm you see Next listening.

**If it never leaves that screen:** open **Render → your service → Logs** and look for build/runtime errors (e.g. failed `npm run build`, missing `DATABASE_URL` if the app crashes on boot).

The app uses **split Auth.js config** (`auth.config.ts` vs `auth.ts`) so **middleware never imports Prisma** (Edge-incompatible). If middleware pulled in `PrismaClient`, the service could fail to become healthy and you’d see the loading screen forever.

### “I don’t see the survey on Render” / **Failed deploy**

- **Different service:** The survey app is usually a **separate** Web Service (e.g. **`lead-agents-survey`**) from **`lead-agents-api`**. On the dashboard, check **Ungrouped services** as well as projects — it may not be inside “My project”.
- **Open the failed service → Logs:** The red **Failed deploy** row is the real answer. Typical fixes:
  - **`DATABASE_URL`** — Required for `prisma generate` during **`npm run build`**. Add a Postgres URL (e.g. create **Render Postgres**, copy **Internal Database URL** into the Web Service env). Without it, the build often exits with Prisma env errors.
  - **`AUTH_SECRET`** — Set a long random string (Auth.js expects it in production).
  - **Root directory** must be **`account`**, **Build** `npm install && npm run build`, **Start** `npm run start`.

`package.json` runs **`prisma generate` before `next build`** so the Prisma client exists on Render. **`prisma`** is listed under **dependencies** so install never skips the CLI.

**If you need the survey to open instantly for customers:** use a **paid** Render instance (no spin-down), or keep the free service warm by pinging **`/api/health`** every ~10 minutes with [UptimeRobot](https://uptimerobot.com), [cron-job.org](https://cron-job.org), or similar.

## Related docs

- Subdomains & custom domains on Cloudflare: `SUBDOMAIN_SETUP.md`, `smartline/SMARTLINE_DEPLOY.md`
- Wiring the in-page agent to the API: `../docs/SMARTLINE_CONNECT_INSTRUCTIONS.md` (in the parent Lead Agents Studio folder)
