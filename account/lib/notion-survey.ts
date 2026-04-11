/**
 * Notion “Quick Fit Check” database — create these properties (exact names):
 * - Name (Title)
 * - Session ID (Text)
 * - Progress (Select: "In progress", "Complete")
 * - Last step (Text)
 * - Q1 … Q9 (Text)
 * - Tags (Text) — newline-separated automation tags
 */

export const NOTION_API_VERSION = "2025-09-03"

export const NOTION_SURVEY_PROPERTIES = {
  title: "Name",
  sessionId: "Session ID",
  progress: "Progress",
  lastStep: "Last step",
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4",
  q5: "Q5",
  q6: "Q6",
  q7: "Q7",
  q8: "Q8",
  q9: "Q9",
  tags: "Tags",
} as const

function rt(content: string) {
  const safe = content.slice(0, 1900)
  return {
    rich_text: [{ type: "text" as const, text: { content: safe } }],
  }
}

function titleProp(content: string) {
  const safe = content.slice(0, 1900)
  return {
    title: [{ type: "text" as const, text: { content: safe } }],
  }
}

export type NotionSurveyPayload = {
  sessionId: string
  lastStep: string
  progress: "In progress" | "Complete"
  q1?: string
  q2?: string
  q3?: string
  q4?: string
  q5?: string
  q6?: string
  q7?: string
  q8?: string
  q9?: string
  tagsLine: string
}

function buildProperties(p: NotionSurveyPayload): Record<string, unknown> {
  const props: Record<string, unknown> = {
    [NOTION_SURVEY_PROPERTIES.sessionId]: rt(p.sessionId),
    [NOTION_SURVEY_PROPERTIES.progress]: {
      select: { name: p.progress },
    },
    [NOTION_SURVEY_PROPERTIES.lastStep]: rt(p.lastStep),
    [NOTION_SURVEY_PROPERTIES.tags]: rt(p.tagsLine),
  }
  if (p.q1 !== undefined) props[NOTION_SURVEY_PROPERTIES.q1] = rt(p.q1)
  if (p.q2 !== undefined) props[NOTION_SURVEY_PROPERTIES.q2] = rt(p.q2)
  if (p.q3 !== undefined) props[NOTION_SURVEY_PROPERTIES.q3] = rt(p.q3)
  if (p.q4 !== undefined) props[NOTION_SURVEY_PROPERTIES.q4] = rt(p.q4)
  if (p.q5 !== undefined) props[NOTION_SURVEY_PROPERTIES.q5] = rt(p.q5)
  if (p.q6 !== undefined) props[NOTION_SURVEY_PROPERTIES.q6] = rt(p.q6)
  if (p.q7 !== undefined) props[NOTION_SURVEY_PROPERTIES.q7] = rt(p.q7)
  if (p.q8 !== undefined) props[NOTION_SURVEY_PROPERTIES.q8] = rt(p.q8)
  if (p.q9 !== undefined) props[NOTION_SURVEY_PROPERTIES.q9] = rt(p.q9)
  return props
}

/**
 * Confirms the id is a database the integration can write to.
 * Common mistake: pasting a parent *page* id instead of the survey *database* id.
 */
export async function notionVerifySurveyDatabase(
  token: string,
  databaseId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_API_VERSION,
    },
  })
  if (res.ok) return { ok: true }
  const body = await res.text()
  const short = body.slice(0, 400)
  const hint =
    "NOTION_SURVEY_DATABASE_ID must be the survey *database* (table), not a parent page. " +
    "In Notion: open the database as a full page → copy link → use the 32-character id from the URL. " +
    "Then: ⋯ on that database → Connections → add your integration."
  return {
    ok: false,
    message: `${hint} (Notion ${res.status}: ${short})`,
  }
}

export async function notionCreateSurveyPage(
  token: string,
  databaseId: string,
  payload: NotionSurveyPayload
): Promise<{ id: string }> {
  const short = payload.sessionId.slice(0, 8)
  const name = `Quick Fit — ${short}`
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        [NOTION_SURVEY_PROPERTIES.title]: titleProp(name),
        ...buildProperties(payload),
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion create failed: ${res.status} ${err}`)
  }
  const data = (await res.json()) as { id: string }
  return { id: data.id }
}

export async function notionUpdateSurveyPage(
  token: string,
  pageId: string,
  payload: NotionSurveyPayload
): Promise<void> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify({
      properties: buildProperties(payload),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion update failed: ${res.status} ${err}`)
  }
}
