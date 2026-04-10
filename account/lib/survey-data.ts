/** Quick Fit Check — branching options and stable ids for tagging */

export type VerticalId =
  | "medspa"
  | "real_estate"
  | "agency"
  | "general"
  | "growth_system"
  | "creative"

export const Q1_OPTIONS: { id: VerticalId; label: string }[] = [
  {
    id: "medspa",
    label: "MedSpa / aesthetic clinic / health business",
  },
  {
    id: "real_estate",
    label: "Real estate agent / team / brokerage / developer",
  },
  { id: "agency", label: "Agency / consultant / service provider" },
  { id: "general", label: "Local business / general business" },
  {
    id: "growth_system",
    label: "I’m mainly interested in a full growth system",
  },
  {
    id: "creative",
    label: "I’m mainly interested in AI creative / ad packs",
  },
]

export const Q2_OPTIONS = [
  { id: "decide", label: "Yes, I decide" },
  { id: "influence", label: "I influence the decision" },
  { id: "research", label: "No, I’m mainly researching" },
] as const

export type LeakOption = { id: string; label: string; painTag: string }

export const Q3_BY_VERTICAL: Record<VerticalId, LeakOption[]> = {
  medspa: [
    {
      id: "m1",
      label: "Missed calls or rushed front-desk conversations",
      painTag: "pain:missed_calls",
    },
    {
      id: "m2",
      label: "After-hours or weekend inquiries going cold",
      painTag: "pain:missed_calls",
    },
    {
      id: "m3",
      label: "Leads disappear after the first message",
      painTag: "pain:slow_followup",
    },
    {
      id: "m4",
      label: "Patients ask price and then vanish",
      painTag: "pain:slow_followup",
    },
    {
      id: "m5",
      label: "Ad creative is getting tired / CPL is rising",
      painTag: "pain:creative_fatigue",
    },
    {
      id: "m6",
      label: "Content creation takes too much time",
      painTag: "pain:consistency",
    },
  ],
  real_estate: [
    {
      id: "r1",
      label: "Buyer inquiries hit voicemail or wait too long",
      painTag: "pain:missed_calls",
    },
    {
      id: "r2",
      label: "Seller leads do not get a fast response",
      painTag: "pain:slow_followup",
    },
    {
      id: "r3",
      label: "Leads go cold before the showing / callback",
      painTag: "pain:slow_followup",
    },
    {
      id: "r4",
      label: "After-hours or weekend inquiries are lost",
      painTag: "pain:missed_calls",
    },
    {
      id: "r5",
      label: "I need better listing / project follow-up",
      painTag: "pain:slow_followup",
    },
    {
      id: "r6",
      label: "My marketing is not generating enough serious conversations",
      painTag: "pain:invisible_offer",
    },
  ],
  agency: [
    {
      id: "a1",
      label: "My AI offer feels custom, messy, or hard to scale",
      painTag: "pain:invisible_offer",
    },
    {
      id: "a2",
      label: "Clients do not clearly see what they are paying for",
      painTag: "pain:invisible_offer",
    },
    {
      id: "a3",
      label:
        "Retention is weak because the service feels invisible",
      painTag: "pain:invisible_offer",
    },
    {
      id: "a4",
      label: "I need a white-label client-facing offer",
      painTag: "pain:invisible_offer",
    },
    {
      id: "a5",
      label: "Delivery is too manual",
      painTag: "pain:consistency",
    },
    {
      id: "a6",
      label: "I need a stronger demo / sales story",
      painTag: "pain:invisible_offer",
    },
  ],
  general: [
    {
      id: "g1",
      label: "Missed inbound calls or messages",
      painTag: "pain:missed_calls",
    },
    {
      id: "g2",
      label: "Slow first response",
      painTag: "pain:slow_followup",
    },
    {
      id: "g3",
      label: "Follow-up is inconsistent",
      painTag: "pain:slow_followup",
    },
    {
      id: "g4",
      label: "Leads die after hours",
      painTag: "pain:missed_calls",
    },
    {
      id: "g5",
      label: "Staff are too busy to respond properly",
      painTag: "pain:consistency",
    },
    {
      id: "g6",
      label: "I need a smarter front line without hiring more people",
      painTag: "pain:invisible_offer",
    },
  ],
  growth_system: [
    {
      id: "gs1",
      label: "Ads get attention but follow-up does not convert it",
      painTag: "pain:slow_followup",
    },
    {
      id: "gs2",
      label: "Creative gets tired too quickly",
      painTag: "pain:creative_fatigue",
    },
    {
      id: "gs3",
      label: "I need avatar + ads + follow-up working together",
      painTag: "pain:consistency",
    },
    {
      id: "gs4",
      label: "My team cannot keep up with content",
      painTag: "pain:consistency",
    },
    {
      id: "gs5",
      label: "There is no clear system from lead to conversation",
      painTag: "pain:invisible_offer",
    },
    {
      id: "gs6",
      label: "I need a stronger launch / front-end system",
      painTag: "pain:invisible_offer",
    },
  ],
  creative: [
    {
      id: "c1",
      label: "My brand looks too generic or ordinary online",
      painTag: "pain:brand_perception",
    },
    {
      id: "c2",
      label: "My ads need fresher creative",
      painTag: "pain:creative_fatigue",
    },
    {
      id: "c3",
      label: "I need founder / owner / brand imagery",
      painTag: "pain:brand_perception",
    },
    {
      id: "c4",
      label: "My content looks inconsistent",
      painTag: "pain:consistency",
    },
    {
      id: "c5",
      label: "I need stronger launch visuals",
      painTag: "pain:creative_fatigue",
    },
    {
      id: "c6",
      label: "I want better creative without a full production shoot",
      painTag: "pain:brand_perception",
    },
  ],
}

export const Q5_OPTIONS = [
  {
    id: "front_desk",
    label: "A smarter front desk / voice agent / follow-up system",
  },
  { id: "full_growth", label: "A full ads + follow-up growth system" },
  { id: "white_label", label: "A white-label agency offer" },
  { id: "premium_creative", label: "Premium creative / ad assets" },
  { id: "content", label: "Ongoing content support" },
  { id: "guidance", label: "Not sure yet — I need guidance" },
] as const

export const Q6_OPTIONS = [
  { id: "lt1k", label: "Under $1,000", budgetTag: "budget:<1k" },
  { id: "1k_3k", label: "$1,000–$3,000", budgetTag: "budget:1k_3k" },
  { id: "3k_5k", label: "$3,000–$5,000", budgetTag: "budget:3k_5k" },
  { id: "5k_10k", label: "$5,000–$10,000", budgetTag: "budget:5k_10k" },
  { id: "10k_plus", label: "$10,000+", budgetTag: "budget:10k_plus" },
  {
    id: "monthly",
    label: "I care more about a monthly option",
    budgetTag: "budget:monthly",
  },
  {
    id: "unknown",
    label: "Not sure yet",
    budgetTag: "budget:unknown",
  },
] as const

export const Q8_OPTIONS = [
  { id: "demo", label: "A demo link", nextTag: "next:demo" },
  { id: "pricing", label: "Pricing", nextTag: "next:pricing" },
  {
    id: "discount",
    label: "The thank-you offer / discount",
    nextTag: "next:discount",
  },
  {
    id: "calendly",
    label: "A 15-minute Calendly call",
    nextTag: "next:calendly",
  },
  {
    id: "updates",
    label: "Just send occasional updates for now",
    nextTag: "next:updates",
  },
] as const

const VERTICAL_TAG: Record<VerticalId, string> = {
  medspa: "vertical:medspa",
  real_estate: "vertical:real_estate",
  agency: "vertical:agency",
  general: "vertical:general",
  growth_system: "vertical:growth_system",
  creative: "vertical:creative",
}

export type SurveyAnswers = {
  q1?: VerticalId
  q2?: string
  q3?: string
  q4?: string
  q5?: string
  q6?: string
  q7?: string
  q8?: string
  q9?: string
}

export function computeAutomationTags(answers: SurveyAnswers): string[] {
  const tags: string[] = []
  if (answers.q1 && VERTICAL_TAG[answers.q1]) {
    tags.push(VERTICAL_TAG[answers.q1])
  }
  if (answers.q1 && answers.q3) {
    const leaks = Q3_BY_VERTICAL[answers.q1]
    const leak = leaks?.find((l) => l.id === answers.q3)
    if (leak?.painTag) tags.push(leak.painTag)
  }
  const b = Q6_OPTIONS.find((o) => o.id === answers.q6)
  if (b?.budgetTag) tags.push(b.budgetTag)
  const n = Q8_OPTIONS.find((o) => o.id === answers.q8)
  if (n?.nextTag) tags.push(n.nextTag)
  return [...new Set(tags)]
}

export function labelForQ1(id: VerticalId | undefined): string {
  if (!id) return ""
  return Q1_OPTIONS.find((o) => o.id === id)?.label ?? ""
}

export function labelForQ2(id: string | undefined): string {
  if (!id) return ""
  return Q2_OPTIONS.find((o) => o.id === id)?.label ?? ""
}

export function labelForQ3(vertical: VerticalId | undefined, leakId: string | undefined): string {
  if (!vertical || !leakId) return ""
  return Q3_BY_VERTICAL[vertical]?.find((l) => l.id === leakId)?.label ?? ""
}

export function labelForQ5(id: string | undefined): string {
  if (!id) return ""
  return Q5_OPTIONS.find((o) => o.id === id)?.label ?? ""
}

export function labelForQ6(id: string | undefined): string {
  if (!id) return ""
  return Q6_OPTIONS.find((o) => o.id === id)?.label ?? ""
}

export function labelForQ8(id: string | undefined): string {
  if (!id) return ""
  return Q8_OPTIONS.find((o) => o.id === id)?.label ?? ""
}

/** Secondary contextual link label + default path key for thank-you page */
export function thankYouContext(vertical: VerticalId | undefined): {
  linkLabel: string
  pathKey: "demo" | "page" | "portfolio"
} {
  switch (vertical) {
    case "agency":
      return { linkLabel: "See the page", pathKey: "page" }
    case "creative":
      return { linkLabel: "View the portfolio", pathKey: "portfolio" }
    default:
      return { linkLabel: "See the demo", pathKey: "demo" }
  }
}
