/**
 * Auto-creates the Notion survey database on first API call when
 * NOTION_INTERNAL_TOKEN + NOTION_PARENT_PAGE_ID are set but
 * NOTION_SURVEY_DATABASE_ID is missing or empty.
 *
 * The created ID is cached in-process and logged so the operator can
 * persist it as NOTION_SURVEY_DATABASE_ID on Render for future deploys.
 */

import { normalizeNotionDatabaseId } from "./notion-ids"

const NOTION_VERSION = "2025-09-03"

let cachedDatabaseId: string | null = null

function hexToUuid(hex: string): string {
  const h = hex.toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function extract32Hex(input: string): string {
  let s = input.trim()
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
  throw new Error("Could not parse Notion page ID from NOTION_PARENT_PAGE_ID")
}

async function createDatabase(token: string, parentPageId: string): Promise<string> {
  const pageId = hexToUuid(extract32Hex(parentPageId))

  const verify = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  })
  if (!verify.ok) {
    const err = await verify.text()
    throw new Error(
      `Cannot access Notion parent page (${verify.status}). ` +
      `Open the page in Notion → "..." → Connections → add your integration. Detail: ${err}`
    )
  }

  const body = {
    parent: { type: "page_id", page_id: pageId },
    title: [{ type: "text", text: { content: "Quick Fit Check — survey responses" } }],
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

  const data = (await res.json()) as { id?: string }
  if (!res.ok || !data.id) {
    throw new Error(`Notion database creation failed (${res.status}): ${JSON.stringify(data)}`)
  }

  return data.id
}

/**
 * Returns a ready-to-use { token, databaseId } or null if Notion isn't
 * configured at all.  Auto-creates the database on first call when only
 * the parent page ID is provided.
 */
export async function getNotionSurveyConfig(): Promise<{
  token: string
  databaseId: string
} | null> {
  const token = process.env.NOTION_INTERNAL_TOKEN?.trim()
  if (!token) return null

  const explicitDbId = process.env.NOTION_SURVEY_DATABASE_ID?.trim()
  if (explicitDbId) {
    return { token, databaseId: normalizeNotionDatabaseId(explicitDbId) }
  }

  if (cachedDatabaseId) {
    return { token, databaseId: cachedDatabaseId }
  }

  const parentPageId = process.env.NOTION_PARENT_PAGE_ID?.trim()
  if (!parentPageId) return null

  try {
    console.log("[notion-auto-db] No NOTION_SURVEY_DATABASE_ID — auto-creating database...")
    const newId = await createDatabase(token, parentPageId)
    cachedDatabaseId = newId
    console.log(
      `[notion-auto-db] Database created! Set this on Render to persist across deploys:\n` +
      `  NOTION_SURVEY_DATABASE_ID=${newId}`
    )
    return { token, databaseId: newId }
  } catch (e) {
    console.error("[notion-auto-db] Auto-creation failed:", e)
    return null
  }
}
