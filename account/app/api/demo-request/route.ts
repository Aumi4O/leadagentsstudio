import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, email, phone, channel } = await request.json()

    // Validate input
    if (!name || !email || !phone || !channel) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Save demo request
    const demoRequest = await prisma.demoRequest.create({
      data: {
        name,
        email,
        phone,
        channel,
        status: "pending", // Will be updated to "paid" after Stripe payment
      },
    })

    return NextResponse.json(
      { 
        message: "Demo request saved",
        id: demoRequest.id
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Demo request error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

// GET - List demo requests (for admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const demoRequests = await prisma.demoRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(demoRequests)
  } catch (error) {
    console.error("Error fetching demo requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch demo requests" },
      { status: 500 }
    )
  }
}
