"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_BY_VERTICAL,
  Q5_OPTIONS,
  Q6_OPTIONS,
  Q8_OPTIONS,
  type SurveyAnswers,
  type VerticalId,
} from "@/lib/survey-data"
import {
  SITE_CALENDLY_URL,
  SITE_SURVEY_OFFER_FALLBACK,
  SITE_SURVEY_THANK_YOU_CODE,
  SITE_SURVEY_DISCOUNT_PERCENT,
} from "@/lib/site-urls"

function isValidHttpUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false
  try {
    const u = new URL(url.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const BROWSER_SURVEY_ID_KEY = "fit-check-session-id"
const NOTION_ROW_ID_KEY = "fit-check-notion-page-id"

function getOrCreateBrowserSurveyId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem(BROWSER_SURVEY_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(BROWSER_SURVEY_ID_KEY, id)
  }
  return id
}

function getStoredNotionPageId(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(NOTION_ROW_ID_KEY)
}

function setStoredNotionPageId(id: string) {
  sessionStorage.setItem(NOTION_ROW_ID_KEY, id)
}

type Step = number

const TOTAL_QUESTIONS = 9

export function SurveyClient() {
  const [step, setStep] = useState<Step>(0)
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const calendlyUrl =
    (process.env.NEXT_PUBLIC_CALENDLY_URL ?? "").trim() || SITE_CALENDLY_URL
  const offerCodeEnv = (process.env.NEXT_PUBLIC_SURVEY_OFFER_CODE ?? "").trim()
  const offerUrl =
    (process.env.NEXT_PUBLIC_SURVEY_OFFER_URL ?? "").trim() ||
    SITE_SURVEY_OFFER_FALLBACK

  const vertical = answers.q1

  const sync = useCallback(
    async (lastStep: string, nextAnswers: SurveyAnswers, isComplete: boolean) => {
      setSyncing(true)
      setSyncError(null)
      try {
        const sessionId = getOrCreateBrowserSurveyId()
        const notionPageId = getStoredNotionPageId()
        const res = await fetch("/api/survey/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            notionPageId: notionPageId ?? undefined,
            lastStep,
            answers: nextAnswers,
            isComplete,
          }),
        })
        const data = (await res.json()) as {
          error?: string
          skipped?: boolean
          notionPageId?: string | null
          notionReady?: boolean
        }
        if (!res.ok) {
          setSyncError(data.error ?? "Save failed")
          return
        }
        if (data.skipped === true) {
          setSyncError(
            typeof data.error === "string" && data.error.trim().length > 0
              ? data.error
              : "Answers aren\u2019t being saved \u2014 Notion isn\u2019t connected. On Render, set NOTION_INTERNAL_TOKEN and NOTION_SURVEY_DATABASE_ID (the database table id, not a parent page), connect the integration to that database, then redeploy."
          )
          return
        }
        if (data.notionPageId && typeof data.notionPageId === "string") {
          setStoredNotionPageId(data.notionPageId)
        }
      } catch {
        setSyncError("Connection issue \u2014 you can keep going; we\u2019ll retry when you\u2019re online.")
      } finally {
        setSyncing(false)
      }
    },
    []
  )

  useEffect(() => {
    getOrCreateBrowserSurveyId()
  }, [])

  const questionIndex = step >= 1 && step <= 9 ? step : 0

  const goNext = async (nextStep: Step, lastStep: string, nextAnswers: SurveyAnswers) => {
    setAnswers(nextAnswers)
    setStep(nextStep)
    await sync(lastStep, nextAnswers, false)
  }

  const finish = async (nextAnswers: SurveyAnswers) => {
    setAnswers(nextAnswers)
    await sync("complete", nextAnswers, true)
    setStep(10)
  }

  const thankYouDiscountCode = offerCodeEnv || SITE_SURVEY_THANK_YOU_CODE

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:py-14">
        {step > 0 && step < 10 && (
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-neutral-500">
              <span>
                Question {questionIndex} of {TOTAL_QUESTIONS}
              </span>
              <span>{Math.round((questionIndex / TOTAL_QUESTIONS) * 100)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-neutral-800 transition-[width] duration-200 ease-out"
                style={{ width: `${(questionIndex / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {syncError ? (
          <p
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950"
            role="status"
          >
            {syncError}
          </p>
        ) : null}

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8">
          {step === 0 && (
            <Intro
              onStart={async () => {
                await sync("after_intro", {}, false)
                setStep(1)
              }}
              syncing={syncing}
            />
          )}

          {step === 1 && (
            <QuestionBlock title="Which best describes you?">
              <OptionList
                options={Q1_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={answers.q1}
                onChange={(id) => setAnswers((a) => ({ ...a, q1: id as VerticalId }))}
              />
              <NavRow
                onBack={() => setStep(0)}
                onNext={() => {
                  if (!answers.q1) return
                  void goNext(2, "after_q1", { ...answers, q1: answers.q1 })
                }}
                nextDisabled={!answers.q1}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 2 && (
            <QuestionBlock title="Are you the person who would approve or strongly influence this purchase?">
              <OptionList
                options={Q2_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={answers.q2}
                onChange={(id) => setAnswers((a) => ({ ...a, q2: id }))}
              />
              <NavRow
                onBack={() => setStep(1)}
                onNext={() => {
                  if (!answers.q2) return
                  void goNext(3, "after_q2", { ...answers, q2: answers.q2 })
                }}
                nextDisabled={!answers.q2}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 3 && (
            vertical ? (
              <QuestionBlock title="Which leak is costing you the most right now?">
                <OptionList
                  options={Q3_BY_VERTICAL[vertical].map((o) => ({
                    id: o.id,
                    label: o.label,
                  }))}
                  value={answers.q3}
                  onChange={(id) => setAnswers((a) => ({ ...a, q3: id }))}
                />
                <NavRow
                  onBack={() => setStep(2)}
                  onNext={() => {
                    if (!answers.q3) return
                    void goNext(4, "after_q3", { ...answers, q3: answers.q3 })
                  }}
                  nextDisabled={!answers.q3}
                  syncing={syncing}
                />
              </QuestionBlock>
            ) : (
              <QuestionBlock title="Let's go back one step.">
                <NavRow
                  onBack={() => setStep(1)}
                  onNext={() => setStep(1)}
                  nextDisabled={false}
                  nextLabel="Pick your category"
                  syncing={syncing}
                />
              </QuestionBlock>
            )
          )}

          {step === 4 && (
            <QuestionBlock title="In your own words, what is the most expensive part of the process that keeps breaking, getting delayed, or losing money?">
              <OpenField
                value={answers.q4 ?? ""}
                onChange={(v) => setAnswers((a) => ({ ...a, q4: v }))}
                placeholder="The more specific you are, the better I can match you."
                minRows={4}
              />
              <NavRow
                onBack={() => setStep(3)}
                onNext={() => {
                  if (!(answers.q4 && answers.q4.trim().length > 2)) return
                  void goNext(5, "after_q4", { ...answers, q4: answers.q4.trim() })
                }}
                nextDisabled={!answers.q4 || answers.q4.trim().length < 3}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 5 && (
            <QuestionBlock title="What would you most want help with in the next 30\u201390 days?">
              <OptionList
                options={Q5_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={answers.q5}
                onChange={(id) => setAnswers((a) => ({ ...a, q5: id }))}
              />
              <NavRow
                onBack={() => setStep(4)}
                onNext={() => {
                  if (!answers.q5) return
                  void goNext(6, "after_q5", { ...answers, q5: answers.q5 })
                }}
                nextDisabled={!answers.q5}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 6 && (
            <QuestionBlock
              title="For the right solution, what level of investment feels realistic in the next 30\u201360 days?"
              hint="Ranges get more honest answers than asking for an exact number."
            >
              <OptionList
                options={Q6_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={answers.q6}
                onChange={(id) => setAnswers((a) => ({ ...a, q6: id }))}
              />
              <NavRow
                onBack={() => setStep(5)}
                onNext={() => {
                  if (!answers.q6) return
                  void goNext(7, "after_q6", { ...answers, q6: answers.q6 })
                }}
                nextDisabled={!answers.q6}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 7 && (
            <QuestionBlock title="What would need to be true for you to feel comfortable moving forward?">
              <p className="mb-3 text-sm text-muted-foreground">
                Examples: tone of voice, ROI, control, handoff to a human, brand fit,
                creative quality, reporting, compliance, proof.
              </p>
              <OpenField
                value={answers.q7 ?? ""}
                onChange={(v) => setAnswers((a) => ({ ...a, q7: v }))}
                placeholder="What would make this a confident yes?"
                minRows={4}
              />
              <NavRow
                onBack={() => setStep(6)}
                onNext={() => {
                  if (!(answers.q7 && answers.q7.trim().length > 2)) return
                  void goNext(8, "after_q7", { ...answers, q7: answers.q7.trim() })
                }}
                nextDisabled={!answers.q7 || answers.q7.trim().length < 3}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 8 && (
            <QuestionBlock title="What would you like me to send you next?">
              <OptionList
                options={Q8_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={answers.q8}
                onChange={(id) => setAnswers((a) => ({ ...a, q8: id }))}
              />
              <NavRow
                onBack={() => setStep(7)}
                onNext={() => {
                  if (!answers.q8) return
                  void goNext(9, "after_q8", { ...answers, q8: answers.q8 })
                }}
                nextDisabled={!answers.q8}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 9 && (
            <QuestionBlock title="Where should we send your next step? (optional)">
              <p className="mb-3 text-sm text-neutral-500">
                This is the only place we ask for contact info. No password or sign-in
                {" \u2014 "}leave blank if you prefer not to share.
              </p>
              <input
                type="text"
                className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                placeholder="Email, phone, or WhatsApp"
                value={answers.q9 ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, q9: e.target.value }))
                }
                autoComplete="email"
              />
              <NavRow
                onBack={() => setStep(8)}
                onNext={() =>
                  void finish({
                    ...answers,
                    q9: answers.q9?.trim() || "(not provided)",
                  })
                }
                nextLabel="Submit"
                nextDisabled={false}
                syncing={syncing}
              />
            </QuestionBlock>
          )}

          {step === 10 && (
            <ThankYou
              calendlyUrl={calendlyUrl}
              discountCode={thankYouDiscountCode}
              offerUrl={offerUrl}
            />
          )}
        </div>
    </main>
  )
}

function Intro({ onStart, syncing }: { onStart: () => void; syncing: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          2-minute check-in
        </p>
        <h1 className="mt-2 text-xl font-semibold leading-snug text-neutral-900 sm:text-2xl">
          Quick Fit Check
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          So we can point you to the right next step.
        </p>
      </div>
      <p className="text-sm leading-relaxed text-neutral-600">
        No sign-in or account needed. Your answers help us match you to the most
        relevant next step {"\u2014"} demo, pricing, a thank-you offer, or a short call when
        it makes sense.
      </p>
      <button
        type="button"
        className="w-full rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:min-w-[8rem]"
        disabled={syncing}
        onClick={() => onStart()}
      >
        {syncing ? "Starting\u2026" : "Start"}
      </button>
    </div>
  )
}

function QuestionBlock({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold leading-snug text-neutral-900 sm:text-xl">
          {title}
        </h2>
        {hint && <p className="mt-2 text-sm text-neutral-500">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function OptionList({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string | undefined
  onChange: (id: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors sm:text-[15px]",
              value === o.id
                ? "border-neutral-900 bg-neutral-50"
                : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80"
            )}
          >
            {o.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

function OpenField({
  value,
  onChange,
  placeholder,
  minRows,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows: number
}) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900",
        "placeholder:text-neutral-400",
        "focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      )}
      style={{ minHeight: `${minRows * 1.5}rem` }}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Next",
  syncing,
}: {
  onBack: () => void
  onNext: () => void
  nextDisabled: boolean
  nextLabel?: string
  syncing: boolean
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
      <button
        type="button"
        className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        onClick={onBack}
        disabled={syncing}
      >
        Back
      </button>
      <button
        type="button"
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
        disabled={nextDisabled || syncing}
        onClick={onNext}
      >
        {syncing ? "Saving\u2026" : nextLabel}
      </button>
    </div>
  )
}

function ThankYou({
  calendlyUrl,
  discountCode,
  offerUrl,
}: {
  calendlyUrl: string
  discountCode: string
  offerUrl: string
}) {
  const bookHref = isValidHttpUrl(calendlyUrl)
    ? calendlyUrl.trim()
    : SITE_CALENDLY_URL

  const [copied, setCopied] = useState(false)
  const code =
    (discountCode && discountCode.trim()) || SITE_SURVEY_THANK_YOU_CODE || "SURVEY"
  const pct = SITE_SURVEY_DISCOUNT_PERCENT

  const copyCode = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6 text-black" style={{ color: "#0a0a0a" }}>
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
          aria-hidden
        >
          <svg
            className="h-7 w-7 text-emerald-700"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold leading-snug sm:text-2xl" style={{ color: "#0a0a0a" }}>
          Thank you — you are all set.
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#404040" }}>
          Your answers have been saved.
        </p>
      </div>

      <section
        className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 text-center shadow-sm"
        aria-labelledby="survey-coupon-heading"
      >
        <h3 id="survey-coupon-heading" className="sr-only">
          Your survey discount
        </h3>
        <p className="text-base font-medium leading-relaxed" style={{ color: "#0a0a0a" }}>
          Your coupon code is <strong className="font-mono">{code}</strong> for{" "}
          <strong>{pct}%</strong> off, as a thank-you for helping with this survey.
        </p>
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <div
            className="rounded-lg border-2 border-dashed border-emerald-700 bg-white px-4 py-3 font-mono text-xl font-bold tracking-widest"
            style={{ color: "#0a0a0a" }}
          >
            {code}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "#047857" }}
          >
            {copied ? "Copied!" : "Copy coupon code"}
          </button>
        </div>
      </section>

      <a
        href={bookHref}
        target="_blank"
        rel="noreferrer"
        className="flex w-full flex-col items-center justify-center gap-1 rounded-xl px-5 py-4 text-center shadow-sm"
        style={{ backgroundColor: "#171717", color: "#ffffff" }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          Book a free 15-minute call (Calendly)
        </span>
        <span className="text-xs" style={{ color: "#d4d4d4" }}>
          Mention code {code} for your {pct}% survey discount when you book.
        </span>
      </a>

      <a
        href={isValidHttpUrl(offerUrl) ? offerUrl.trim() : SITE_SURVEY_OFFER_FALLBACK}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center rounded-xl border-2 border-neutral-900 bg-white px-4 py-4 text-center shadow-sm transition-colors hover:bg-neutral-50"
        style={{ color: "#0a0a0a" }}
      >
        <span className="text-sm font-medium leading-snug">
          Use Code <strong className="font-semibold">{code}</strong> for {pct}% discount as my
          gratitude for taking this survey.
        </span>
      </a>
    </div>
  )
}
