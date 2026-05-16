#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const localEnvPath = resolve(process.cwd(), "account/.env.local")

if (existsSync(localEnvPath)) {
  const lines = readFileSync(localEnvPath, "utf8").split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
  }
}

const listAddress = process.env.MAILGUN_VISITOR_LIST_ADDRESS || "support@smartlineagents.com"
const apiKey = process.env.MAILGUN_API_KEY
const region = (process.env.MAILGUN_REGION || "US").toUpperCase()
const baseUrl = region === "EU" ? "https://api.eu.mailgun.net/v3" : "https://api.mailgun.net/v3"

if (!apiKey) {
  console.error("MAILGUN_API_KEY is required.")
  process.exit(1)
}

const body = new URLSearchParams({
  address: listAddress,
  name: "SmartLine Subscribers",
  description: "Visitor opt-ins for SmartLine Agent.",
  access_level: "readonly",
})

const response = await fetch(`${baseUrl}/lists`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body,
})

const text = await response.text()

if (!response.ok) {
  const alreadyExists = response.status === 400 && /exists|duplicate/i.test(text)
  if (alreadyExists) {
    console.log(`Mailgun list already exists: ${listAddress}`)
    process.exit(0)
  }

  console.error(`Mailgun list creation failed (${response.status}): ${text}`)
  process.exit(1)
}

console.log(`Created Mailgun list: ${listAddress}`)
