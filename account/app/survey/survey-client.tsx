"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_BY_VERTICAL,
  Q5_OPTIONS,
  Q6_OPTIONS,
  Q8_OPTIONS,
  thankYouContext,
  type SurveyAnswers,
  type VerticalId,
} from "@/lib/survey-data"

const SESSION_KEY = "fit-check-session-id"
const PAGE_KEY = "fit-check-notion-page-id"

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function getStoredPageId(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(PAGE_KEY)
}

function setStoredPageId(id: string) {
  sessionStorage.setItem(PAGE_KEY, id)
}

type Step = number

const TOTAL_QUESTIONS = 9

export function SurveyClient() {
  const [step, setStep] = useState<Step>(0)
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? ""
  const offerUrl = process.env.NEXT_PUBLIC_SURVEY_OFFER_URL ?? ""
  const demoUrl = process.env.NEXT_PUBLIC_SURVEY_DEMO_URL ?? ""
  const agencyPageUrl = process.env.NEXT_PUBLIC_SURVEY_AGENCY_PAGE_URL ?? ""
  const portfolioUrl = process.env.NEXT_PUBLIC_SURVEY_PORTFOLIO_URL ?? ""

  const vertical = answers.q1
  const ctx = thankYouContext(vertical)

  const contextHref = useMemo(() => {
    if (ctx.pathKey === "page") return agencyPageUrl || demoUrl
    if (ctx.pathKey === "portfolio") return portfolioUrl || demoUrl
    return demoUrl
  }, [ctx.pathKey, agencyPageUrl, portfolioUrl, demoUrl])

  const sync = useCallback(
    async (lastStep: string, nextAnswers: SurveyAnswers, isComplete: boolean) => {
      setSyncing(true)
      setSyncError(null)
      try {
        const sessionId = getOrCreateSessionId()
        const notionPageId = getStoredPageId()
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
        const data = await res.json()
        if (!res.ok) {
          setSyncError(data.error ?? "Save failed")
          return
        }
        if (data.notionPageId && typeof data.notionPageId === "string") {
          setStoredPageId(data.notionPageId)
        }
      } catch {
        setSyncError("Network error — progress saved locally until connection works.")
      } finally {
        setSyncing(false)
      }
    },
    []
  )

  useEffect(() => {
    getOrCreateSessionId()
  }, [])

  useEffect(() => {
    if (step === 3 && !vertical) setStep(1)
  }, [step, vertical])

  const questionIndex = step >= 1 && step <= 9 ? step : 0

  const goNext = async (nextStep: Step, lastStep: string, nextAnswers: SurveyAnswers) => {
    setAnswers(nextAnswers)
    await sync(lastStep, nextAnswers, false)
    setStep(nextStep)
  }

  const finish = async (nextAnswers: SurveyAnswers) => {
    setAnswers(nextAnswers)
    await sync("complete", nextAnswers, true)
    setStep(10)
  }

  const primaryThankYouFirst =
    answers.q8 === "calendly" || answers.q8 === "discount"

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="light-beams" aria-hidden>
        <div className="beam beam-cyan" />
        <div className="beam beam-pink" />
        <div className="beam beam-blue" />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {step > 0 && step < 10 && (
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>
                Question {questionIndex} of {TOTAL_QUESTIONS}
              </span>
              <span>{Math.round((questionIndex / TOTAL_QUESTIONS) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#ff3b8b] transition-all duration-300"
                style={{ width: `${(questionIndex / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {syncError && (
          <p
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="status"
          >
            {syncError}
          </p>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
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

          {step === 3 && vertical && (
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
            <QuestionBlock title="What would you most want help with in the next 30–90 days?">
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
              title="For the right solution, what level of investment feels realistic in the next 30–60 days?"
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
            <QuestionBlock title="Best email and, if useful, phone or WhatsApp?">
              <p className="mb-3 text-sm text-muted-foreground">
                Only if you want a follow-up.
              </p>
              <Input
                type="text"
                className="mb-3"
                placeholder="Email, phone, or WhatsApp (optional)"
                value={answers.q9 ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, q9: e.target.value }))
                }
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
              primaryFirst={primaryThankYouFirst}
              calendlyUrl={calendlyUrl}
              offerUrl={offerUrl}
              contextLabel={ctx.linkLabel}
              contextHref={contextHref}
              choice={answers.q8}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function Intro({ onStart, syncing }: { onStart: () => void; syncing: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Quick Fit Check — so I can point you to the right offer
        </h1>
      </div>
      <p className="text-muted-foreground">
        This takes about 2 minutes.
        <br />
        <br />
        I’ll use your answers to point you to the most relevant offer and, if it
        makes sense, send you the best next step — demo, pricing, a thank-you
        discount, or a short call.
      </p>
      <Button
        type="button"
        className="w-full bg-[#1d1d1f] text-white hover:bg-black sm:w-auto"
        size="lg"
        disabled={syncing}
        onClick={() => onStart()}
      >
        {syncing ? "Starting…" : "Start"}
      </Button>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{title}</h2>
        {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
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
              "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors sm:text-base",
              value === o.id
                ? "border-[#00d4ff] bg-cyan-50/80 ring-2 ring-[#00d4ff]/30"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/50"
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
        "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onBack} disabled={syncing}>
        Back
      </Button>
      <Button
        type="button"
        className="bg-[#1d1d1f] text-white hover:bg-black"
        disabled={nextDisabled || syncing}
        onClick={onNext}
      >
        {syncing ? "Saving…" : nextLabel}
      </Button>
    </div>
  )
}

function ThankYou({
  primaryFirst,
  calendlyUrl,
  offerUrl,
  contextLabel,
  contextHref,
  choice,
}: {
  primaryFirst: boolean
  calendlyUrl: string
  offerUrl: string
  contextLabel: string
  contextHref: string
  choice: string | undefined
}) {
  const book = (
    <Button
      asChild
      size="lg"
      className="w-full bg-gradient-to-r from-[#00d4ff] to-[#ff3b8b] text-white hover:opacity-95"
    >
      <a href={calendlyUrl || "#"} target="_blank" rel="noreferrer">
        Book a 15-Minute Session
      </a>
    </Button>
  )
  const offer = (
    <Button asChild variant="outline" size="lg" className="w-full border-2">
      <a href={offerUrl || "#"} target="_blank" rel="noreferrer">
        Claim the THANKYOU Offer
      </a>
    </Button>
  )

  return (
    <div className="space-y-6 text-center sm:text-left">
      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
        Thanks — based on what you shared, I can point you to the fastest next
        step.
      </h2>
      {choice === "calendly" && calendlyUrl && (
        <p className="text-sm text-muted-foreground">
          You asked for a short call — use the button below when you’re ready.
        </p>
      )}
      {choice === "discount" && offerUrl && (
        <p className="text-sm text-muted-foreground">
          You asked for the thank-you offer — it’s on the next page.
        </p>
      )}
      <div className="flex flex-col gap-3 pt-2">
        {primaryFirst ? (
          <>
            {choice === "discount" ? (
              <>
                {offer}
                {book}
              </>
            ) : (
              <>
                {book}
                {offer}
              </>
            )}
          </>
        ) : (
          <>
            {book}
            {offer}
          </>
        )}
      </div>
      {contextHref ? (
        <p className="pt-4 text-sm">
          <a
            href={contextHref}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {contextLabel}
          </a>
        </p>
      ) : (
        <p className="pt-4 text-sm text-muted-foreground">
          {contextLabel} — add{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_SURVEY_DEMO_URL</code>{" "}
          (and vertical URLs if needed) in env.
        </p>
      )}
    </div>
  )
}
