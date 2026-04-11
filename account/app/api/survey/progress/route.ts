import { NextResponse } from "next/server"
import {
  computeAutomationTags,
  labelForQ1,
  labelForQ2,
  labelForQ3,
  labelForQ5,
  labelForQ6,
  labelForQ8,
  type SurveyAnswers,
  type VerticalId,
} from "@/lib/survey-data"
import {
  notionCreateSurveyPage,
  notionUpdateSurveyPage,
  notionVerifySurveyDatabase,
  type NotionSurveyPayload,
} from "@/lib/notion-survey"
import { getNotionSurveyConfig } from "@/lib/notion-auto-db"

const VERTICAL_IDS: VerticalId[] = [
  "medspa",
  "real_estate",
  "agency",
  "general",
  "growth_system",
  "creative",
]

/** Avoid verifying the same database on every step (Notion rate limits). */
const verifiedDatabaseIds = new Set<string>()

function isVerticalId(v: string | undefined): v is VerticalId {
  return !!v && VERTICAL_IDS.includes(v as VerticalId)
}

function buildPayload(
  sessionId: string,
  lastStep: string,
  answers: SurveyAnswers,
  progress: "In progress" | "Complete"
): NotionSurveyPayload {
  const v = isVerticalId(answers.q1) ? answers.q1 : undefined
  const tags = computeAutomationTags({
    ...answers,
    q1: v,
  }).join("\n")
  return {
    sessionId,
    lastStep,
    progress,
    q1: v ? labelForQ1(v) : undefined,
    q2: answers.q2 ? labelForQ2(answers.q2) : undefined,
    q3: v && answers.q3 ? labelForQ3(v, answers.q3) : undefined,
    q4: answers.q4,
    q5: answers.q5 ? labelForQ5(answers.q5) : undefined,
    q6: answers.q6 ? labelForQ6(answers.q6) : undefined,
    q7: answers.q7,
    q8: answers.q8 ? labelForQ8(answers.q8) : undefined,
    q9: answers.q9,
    tagsLine: tags || " ",
  }
}

function notionErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
    const notionPageId =
      typeof body.notionPageId === "string" && body.notionPageId.length > 0
        ? body.notionPageId.trim()
        : undefined
    const lastStep = typeof body.lastStep === "string" ? body.lastStep.slice(0, 120) : "unknown"
    const answers = (body.answers ?? {}) as SurveyAnswers
    const isComplete = Boolean(body.isComplete)

    if (!sessionId || sessionId.length < 8) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 })
    }

    const notionConfig = await getNotionSurveyConfig()

    if (!notionConfig) {
      console.warn(
        "survey/progress: Notion not configured. Set NOTION_INTERNAL_TOKEN + NOTION_SURVEY_DATABASE_ID (or NOTION_PARENT_PAGE_ID)."
      )
      return NextResponse.json({
        ok: true,
        skipped: true,
        notionReady: false,
        error:
          "Notion is not configured on the server. Add NOTION_INTERNAL_TOKEN and NOTION_SURVEY_DATABASE_ID on Render.",
        notionPageId: notionPageId ?? null,
      })
    }

    const { token, databaseId } = notionConfig

    if (!verifiedDatabaseIds.has(databaseId)) {
      const verify = await notionVerifySurveyDatabase(token, databaseId)
      if (!verify.ok) {
        console.error("survey/progress: database verify failed:", verify.message)
        return NextResponse.json({
          ok: true,
          skipped: true,
          notionReady: false,
          error: verify.message,
          notionPageId: notionPageId ?? null,
        })
      }
      verifiedDatabaseIds.add(databaseId)
    }

    const progress: "In progress" | "Complete" = isComplete ? "Complete" : "In progress"
    const payload = buildPayload(sessionId, lastStep, answers, progress)

    if (!notionPageId) {
      const { id } = await notionCreateSurveyPage(token, databaseId, payload)
      return NextResponse.json({ ok: true, notionPageId: id, notionReady: true })
    }

    await notionUpdateSurveyPage(token, notionPageId, payload)
    return NextResponse.json({ ok: true, notionPageId, notionReady: true })
  } catch (e) {
    const msg = notionErrorMessage(e)
    console.error("survey/progress:", msg)
    return NextResponse.json(
      {
        error:
          "Could not save to Notion. Check NOTION_SURVEY_DATABASE_ID (must be the database table id) and that the integration is connected to that database. " +
          msg.slice(0, 500),
        notionReady: false,
      },
      { status: 502 }
    )
  }
}
