import { NextResponse } from "next/server"
import { addSubscriberToMailgunList } from "@/lib/mailgun"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(request: Request) {
  try {
    const { email, name, source } = await request.json()
    const normalizedEmail = String(email || "").trim().toLowerCase()
    const normalizedName = String(name || "").trim()

    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400, headers: corsHeaders }
      )
    }

    await addSubscriberToMailgunList({
      email: normalizedEmail,
      name: normalizedName || undefined,
      source: source || "website-opt-in",
    })

    return NextResponse.json(
      { message: "Subscribed" },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json(
      { error: "Subscription failed. Please try again." },
      { status: 500, headers: corsHeaders }
    )
  }
}
