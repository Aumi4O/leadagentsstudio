import { NextResponse } from "next/server"

export async function GET() {
  const hasNotionToken = Boolean(
    process.env.NOTION_INTERNAL_TOKEN?.trim().length
  )
  const hasNotionDb = Boolean(
    process.env.NOTION_SURVEY_DATABASE_ID?.trim().length
  )
  const hasParentPage = Boolean(
    process.env.NOTION_PARENT_PAGE_ID?.trim().length
  )
  return NextResponse.json(
    {
      ok: true,
      service: "account",
      notionSurvey: {
        ready: hasNotionToken && (hasNotionDb || hasParentPage),
        hasToken: hasNotionToken,
        hasDatabaseId: hasNotionDb,
        hasParentPageId: hasParentPage,
        willAutoCreate: hasNotionToken && !hasNotionDb && hasParentPage,
      },
    },
    { status: 200 }
  )
}
