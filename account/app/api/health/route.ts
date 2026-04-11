import { NextResponse } from "next/server"

/** Render / load balancer health check — keep fast and auth-free */
export async function GET() {
  const hasNotionToken = Boolean(
    process.env.NOTION_INTERNAL_TOKEN?.trim().length
  )
  const hasNotionDb = Boolean(
    process.env.NOTION_SURVEY_DATABASE_ID?.trim().length
  )
  return NextResponse.json(
    {
      ok: true,
      service: "account",
      notionSurvey: {
        ready: hasNotionToken && hasNotionDb,
        hasToken: hasNotionToken,
        hasDatabaseId: hasNotionDb,
      },
    },
    { status: 200 }
  )
}
