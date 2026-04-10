#!/usr/bin/env node
/**
 * Creates a Notion database matching account/lib/notion-survey.ts (Quick Fit Check).
 *
 * Internal integrations cannot create databases at workspace root — Notion requires
 * a parent PAGE that is explicitly connected to your integration.
 *
 *   NOTION_INTERNAL_TOKEN=secret \
 *   NOTION_PARENT_PAGE_ID="https://www.notion.so/...." \
 *   node scripts/create-notion-survey-database.mjs
 *
 * zsh: no space after the line-ending backslash.
 */

const NOTION_VERSION = "2025-09-03"

/** 32 hex → UUID for Notion API */
function hexToUuid(hex) {
  const h = hex.toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Pull 32-char page id from:
 * - https://www.notion.so/abc...32hex
 * - https://www.notion.so/Title-With-Words-abc...32hex  (id is last 32 hex)
 * - ?p=uuid or ?p=32hex
 * - raw 32 hex or hyphenated UUID
 */
function extract32Hex(input) {
  let s = String(input).trim()
  const q = s.match(/[?&]p=([0-9a-f-]{36}|[0-9a-f]{32})/i)
  if (q) {
    const raw = q[1].replace(/-/g, "")
    if (/^[0-9a-f]{32}$/i.test(raw)) return raw.toLowerCase()
  }
  s = s.split("?")[0]
  const last32 = s.match(/([0-9a-f]{32})\s*$/i)
  if (last32) return last32[1].toLowerCase()
  const bare = s.replace(/-/g, "").replace(/\s/g, "")
  if (/^[0-9a-f]{32}$/i.test(bare)) return bare.toLowerCase()
  throw new Error(
    "Could not read a Notion page id. Paste the full “Copy link” URL from Notion, or a 32-character id."
  )
}

function notionHint404() {
  console.error(`
Notion returned 404 / object_not_found — the integration cannot see that page yet.

Do this (internal integrations need a real parent page; workspace-root is not allowed):

  1. In Notion, create a NEW normal page (e.g. "Quick Fit — data") anywhere you control.
  2. Stay on that page. Top right: "..." → "Connect to" (or "Connections" / "Add connections").
  3. Add your integration: "Lead Agents Studio".
  4. Use "Copy link" on THAT page as NOTION_PARENT_PAGE_ID and run this script again.

If you do not see "Connect to", try: Share → search for the integration name.

Tip: The line-ending backslash must be the LAST character — no space after \\.
`)
}

async function main() {
  const token = process.env.NOTION_INTERNAL_TOKEN
  const rawParent = process.env.NOTION_PARENT_PAGE_ID
  if (!token || !rawParent) {
    console.error(
      "Set NOTION_INTERNAL_TOKEN and NOTION_PARENT_PAGE_ID (Notion page URL or 32-char id)."
    )
    process.exit(1)
  }

  if (/^\s*workspace\s*$/i.test(String(rawParent).trim())) {
    console.error(`
NOTION_PARENT_PAGE_ID=workspace does not work for Internal integrations.

Notion only allows workspace-root database creation for public integrations with
insert_content. Yours is internal — you must use a parent page:

  1. Create a new page in Notion.
  2. "..." → Connect to → add "Lead Agents Studio".
  3. Copy link to that page → use it as NOTION_PARENT_PAGE_ID.
`)
    process.exit(1)
  }

  const pageId = hexToUuid(extract32Hex(rawParent))
  const verify = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  })
  if (!verify.ok) {
    const err = await verify.json().catch(() => ({}))
    console.error("Could not access parent page:", verify.status, JSON.stringify(err, null, 2))
    if (verify.status === 404) notionHint404()
    process.exit(1)
  }

  const parent = { type: "page_id", page_id: pageId }

  const body = {
    parent,
    title: [
      {
        type: "text",
        text: { content: "Quick Fit Check — survey responses" },
      },
    ],
    properties: {
      Name: { title: {} },
      "Session ID": { rich_text: {} },
      Progress: {
        select: {
          options: [
            { name: "In progress", color: "yellow" },
            { name: "Complete", color: "green" },
          ],
        },
      },
      "Last step": { rich_text: {} },
      Q1: { rich_text: {} },
      Q2: { rich_text: {} },
      Q3: { rich_text: {} },
      Q4: { rich_text: {} },
      Q5: { rich_text: {} },
      Q6: { rich_text: {} },
      Q7: { rich_text: {} },
      Q8: { rich_text: {} },
      Q9: { rich_text: {} },
      Tags: { rich_text: {} },
    },
  }

  const res = await fetch("https://api.notion.com/v1/databases", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("Notion API error:", res.status, JSON.stringify(data, null, 2))
    if (res.status === 404) notionHint404()
    process.exit(1)
  }

  console.log("Created database.")
  console.log("ID (set as NOTION_SURVEY_DATABASE_ID on Render):", data.id)
  console.log("URL:", data.url ?? "(open from Notion sidebar)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
