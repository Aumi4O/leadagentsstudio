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

const DB_ACCESS_HINT =
  "NOTION_SURVEY_DATABASE_ID must be the survey *database* (table), not a parent page. " +
  "In Notion: open the database as a full page → copy link → use the 32-character id from the URL. " +
  "Then: ⋯ on that database → Connections → add your integration."

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
  return {
    ok: false,
    message: `${DB_ACCESS_HINT} (Notion ${res.status}: ${short})`,
  }
}

type NotionDbProps = Record<string, { id: string; name?: string; type: string }>

/**
 * Notion 2025-09-03: GET /databases/:id no longer returns `properties`; schema
 * lives on GET /data_sources/:data_source_id. PATCH schema via PATCH /data_sources/:id
 * using explicit `type` on each new property.
 */
async function fetchSurveyDbProperties(
  token: string,
  databaseId: string
): Promise<
  | { ok: true; properties: NotionDbProps; dataSourceId: string | null }
  | { ok: false; message: string }
> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_API_VERSION,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    return {
      ok: false,
      message: `${DB_ACCESS_HINT} (Notion ${res.status}: ${body.slice(0, 400)})`,
    }
  }

  const data = (await res.json()) as {
    properties?: NotionDbProps
    data_sources?: { id: string; name?: string }[]
  }

  const legacy = data.properties
  if (legacy && Object.keys(legacy).length > 0) {
    return { ok: true, properties: legacy, dataSourceId: null }
  }

  const sources = data.data_sources
  if (!sources?.length) {
    return {
      ok: false,
      message:
        "Notion returned this database without a property schema (API 2025-09-03). " +
        "Open the database in Notion → ⋯ → Manage data sources → ensure a data source exists and the integration is connected.",
    }
  }

  const dsId = sources[0].id
  const dsRes = await fetch(`https://api.notion.com/v1/data_sources/${dsId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_API_VERSION,
    },
  })
  if (!dsRes.ok) {
    const err = await dsRes.text()
    return {
      ok: false,
      message: `Could not load Notion data source schema (${dsRes.status}): ${err.slice(0, 400)}`,
    }
  }

  const dsJson = (await dsRes.json()) as { properties?: NotionDbProps }
  const props = dsJson.properties ?? {}
  return { ok: true, properties: props, dataSourceId: dsId }
}

function findTitlePropertyName(props: NotionDbProps): string | null {
  for (const [key, v] of Object.entries(props)) {
    if (!v || typeof v !== "object") continue
    if (v.type === "title") return v.name ?? key
  }
  return null
}

/** PATCH /data_sources expects `type` + config per property (2025-09-03). */
function toDataSourceSchemaAdditions(
  additions: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(additions)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      if ("rich_text" in o) {
        out[key] = { type: "rich_text", rich_text: o.rich_text ?? {} }
      } else if ("select" in o) {
        out[key] = { type: "select", select: o.select }
      } else if ("title" in o) {
        out[key] = { type: "title", title: o.title ?? {} }
      } else {
        out[key] = v
      }
    } else {
      out[key] = v
    }
  }
  return out
}

function surveyPropertyAdditions(existing: NotionDbProps): Record<string, unknown> {
  const has = (name: string) => Object.prototype.hasOwnProperty.call(existing, name)
  const add: Record<string, unknown> = {}

  if (!has(NOTION_SURVEY_PROPERTIES.sessionId)) {
    add[NOTION_SURVEY_PROPERTIES.sessionId] = { rich_text: {} }
  }
  if (!has(NOTION_SURVEY_PROPERTIES.progress)) {
    add[NOTION_SURVEY_PROPERTIES.progress] = {
      select: {
        options: [
          { name: "In progress", color: "yellow" },
          { name: "Complete", color: "green" },
        ],
      },
    }
  }
  if (!has(NOTION_SURVEY_PROPERTIES.lastStep)) {
    add[NOTION_SURVEY_PROPERTIES.lastStep] = { rich_text: {} }
  }
  for (const k of ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"] as const) {
    const name = NOTION_SURVEY_PROPERTIES[k]
    if (!has(name)) add[name] = { rich_text: {} }
  }
  if (!has(NOTION_SURVEY_PROPERTIES.tags)) {
    add[NOTION_SURVEY_PROPERTIES.tags] = { rich_text: {} }
  }
  return add
}

/**
 * Ensures the database has every column the survey writer expects. Notion returns
 * validation_error if properties are missing; many workspaces link an empty or
 * template DB — we PATCH missing schema in one call.
 *
 * With Notion-Version 2025-09-03, schema is read/updated on the **data source**,
 * not the database object.
 */
export async function notionPrepareSurveyDatabase(
  token: string,
  databaseId: string
): Promise<
  { ok: true; titlePropertyName: string; dataSourceId: string | null } | { ok: false; message: string }
> {
  const loaded = await fetchSurveyDbProperties(token, databaseId)
  if (!loaded.ok) return loaded

  const { properties: props, dataSourceId } = loaded
  const titlePropertyName = findTitlePropertyName(props)
  if (!titlePropertyName) {
    return {
      ok: false,
      message:
        "This Notion database/data source has no title column. In Notion, every table needs one title property — add it in the database schema or use a new database.",
    }
  }

  const additions = surveyPropertyAdditions(props)
  if (Object.keys(additions).length === 0) {
    return { ok: true, titlePropertyName, dataSourceId }
  }

  const patchBody =
    dataSourceId !== null
      ? { properties: toDataSourceSchemaAdditions(additions) }
      : { properties: additions }

  const patchUrl =
    dataSourceId !== null
      ? `https://api.notion.com/v1/data_sources/${dataSourceId}`
      : `https://api.notion.com/v1/databases/${databaseId}`

  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify(patchBody),
  })

  if (!patchRes.ok) {
    const err = await patchRes.text()
    return {
      ok: false,
      message:
        `Could not add required survey columns (${patchRes.status}). ` +
        `Add them manually in Notion (exact names): Session ID, Progress (select: In progress, Complete), ` +
        `Last step, Q1–Q9 (text), Tags. Notion said: ${err.slice(0, 500)}`,
    }
  }

  return { ok: true, titlePropertyName, dataSourceId }
}

export async function notionCreateSurveyPage(
  token: string,
  databaseId: string,
  payload: NotionSurveyPayload,
  titlePropertyName: string,
  dataSourceId: string | null
): Promise<{ id: string }> {
  const short = payload.sessionId.slice(0, 8)
  const name = `Quick Fit — ${short}`
  const parent =
    dataSourceId !== null
      ? { type: "data_source_id" as const, data_source_id: dataSourceId }
      : { database_id: databaseId }
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify({
      parent,
      properties: {
        [titlePropertyName]: titleProp(name),
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
