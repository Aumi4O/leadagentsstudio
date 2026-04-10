import { NextResponse } from "next/server"

/** Render / load balancer health check — keep fast and auth-free */
export async function GET() {
  return NextResponse.json({ ok: true, service: "account" }, { status: 200 })
}
