type SubscribeInput = {
  email: string
  name?: string
  source?: string
}

const DEFAULT_LIST_ADDRESS = "support@smartlineagents.com"

function mailgunBaseUrl() {
  return (process.env.MAILGUN_REGION || "").toUpperCase() === "EU"
    ? "https://api.eu.mailgun.net/v3"
    : "https://api.mailgun.net/v3"
}

function authHeader(apiKey: string) {
  return `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`
}

export function getMailgunListAddress() {
  return process.env.MAILGUN_VISITOR_LIST_ADDRESS || DEFAULT_LIST_ADDRESS
}

export async function addSubscriberToMailgunList({
  email,
  name,
  source,
}: SubscribeInput) {
  const apiKey = process.env.MAILGUN_API_KEY
  const listAddress = getMailgunListAddress()

  if (!apiKey) {
    console.warn("MAILGUN_API_KEY is not configured; subscriber was not added.")
    return { skipped: true }
  }

  const body = new URLSearchParams({
    address: email,
    subscribed: "yes",
    upsert: "yes",
    vars: JSON.stringify({
      source: source || "website",
      subscribedAt: new Date().toISOString(),
    }),
  })

  if (name) {
    body.set("name", name)
  }

  const response = await fetch(
    `${mailgunBaseUrl()}/lists/${encodeURIComponent(listAddress)}/members`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(apiKey),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Mailgun subscribe failed: ${response.status} ${message}`)
  }

  return response.json()
}
