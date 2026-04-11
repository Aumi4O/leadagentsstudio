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
  type NotionSurveyPayload,
} from "@/lib/notion-survey"
import { normalizeNotionDatabaseId } from "@/lib/notion-ids"

const VERTICAL_IDS: VerticalId[] = [
  "medspa",
  "real_estate",
  "agency",
  "general",
  "growth_system",
  "creative",
]

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

    const token = process.env.NOTION_INTERNAL_TOKEN?.trim()
    const databaseIdRaw = process.env.NOTION_SURVEY_DATABASE_ID?.trim()
    const databaseId = databaseIdRaw
      ? normalizeNotionDatabaseId(databaseIdRaw)
      : ""

    if (!token || !databaseId) {
      console.warn(
        "survey/progress: Notion not configured (set NOTION_INTERNAL_TOKEN + NOTION_SURVEY_DATABASE_ID on Render, redeploy)"
      )
      return NextResponse.json({
        ok: true,
        skipped: true,
        notionReady: false,
        notionPageId: notionPageId ?? null,
      })
    }

    const progress: "In progress" | "Complete" = isComplete ? "Complete" : "In progress"
    const payload = buildPayload(sessionId, lastStep, answers, progress)

    if (!notionPageId) {
      const { id } = await notionCreateSurveyPage(token, databaseId, payload)
      return NextResponse.json({ ok: true, notionPageId: id })
    }

    await notionUpdateSurveyPage(token, notionPageId, payload)
    return NextResponse.json({ ok: true, notionPageId })
  } catch (e) {
    console.error("survey/progress:", e)
    return NextResponse.json(
      { error: "Couldn’t sync this step — you can still continue." },
      { status: 500 }
    )
  }
}
