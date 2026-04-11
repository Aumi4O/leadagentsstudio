"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  SITE_CALENDLY_URL,
  SITE_SURVEY_OFFER_FALLBACK,
  SITE_SURVEY_THANK_YOU_CODE,
  siteDefaultContextUrl,
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

/** Anonymous browser id for Notion sync (not a user login / account). */
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
  const offerUrlRaw = (process.env.NEXT_PUBLIC_SURVEY_OFFER_URL ?? "").trim()
  const offerUrlResolved = useMemo(() => {
    if (isValidHttpUrl(offerUrlRaw)) return offerUrlRaw.trim()
    return SITE_SURVEY_OFFER_FALLBACK
  }, [offerUrlRaw])

  const offerCodeEnv = (process.env.NEXT_PUBLIC_SURVEY_OFFER_CODE ?? "").trim()
  const demoUrl = (process.env.NEXT_PUBLIC_SURVEY_DEMO_URL ?? "").trim()
  const agencyPageUrl = (process.env.NEXT_PUBLIC_SURVEY_AGENCY_PAGE_URL ?? "").trim()
  const portfolioUrl = (process.env.NEXT_PUBLIC_SURVEY_PORTFOLIO_URL ?? "").trim()

  const vertical = answers.q1
  const ctx = thankYouContext(vertical)

  const contextHref = useMemo(() => {
    const fromEnv =
      ctx.pathKey === "page"
        ? agencyPageUrl || demoUrl
        : ctx.pathKey === "portfolio"
          ? portfolioUrl || demoUrl
          : demoUrl
    if (isValidHttpUrl(fromEnv)) return fromEnv.trim()
    return siteDefaultContextUrl(ctx.pathKey)
  }, [ctx.pathKey, agencyPageUrl, portfolioUrl, demoUrl])

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
        }
        if (!res.ok) {
          setSyncError(data.error ?? "Save failed")
          return
        }
        if (data.skipped === true) {
          setSyncError(
            "Answers aren’t being saved — Notion isn’t connected. On Render, set NOTION_INTERNAL_TOKEN and NOTION_SURVEY_DATABASE_ID, open the database in Notion → Connections → add your integration, then redeploy. Check /api/health — notionSurvey.ready should be true."
          )
          return
        }
        if (data.notionPageId && typeof data.notionPageId === "string") {
          setStoredNotionPageId(data.notionPageId)
        }
      } catch {
        setSyncError("Connection issue — you can keep going; we’ll retry when you’re online.")
      } finally {
        setSyncing(false)
      }
    },
    []
  )

  useEffect(() => {
    getOrCreateBrowserSurveyId()
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

  const thankYouModalCode = useMemo(() => {
    if (offerCodeEnv) return offerCodeEnv
    if (answers.q8 === "discount") return SITE_SURVEY_THANK_YOU_CODE
    return ""
  }, [offerCodeEnv, answers.q8])

  const [thankYouModalOpen, setThankYouModalOpen] = useState(false)
  useEffect(() => {
    if (step === 10 && thankYouModalCode) setThankYouModalOpen(true)
  }, [step, thankYouModalCode])

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

        {syncError && (
          <p className="mb-4 text-center text-xs text-neutral-500" role="status">
            {syncError}
          </p>
        )}

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
            <QuestionBlock title="Where should we send your next step? (optional)">
              <p className="mb-3 text-sm text-neutral-500">
                This is the only place we ask for contact info. No password or sign-in
                — leave blank if you prefer not to share.
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
            <>
              <ThankYouCodeModal
                open={thankYouModalOpen}
                onClose={() => setThankYouModalOpen(false)}
                code={thankYouModalCode}
                calendlyUrl={calendlyUrl}
                offerPageUrl={offerUrlResolved}
              />
              <ThankYou
                primaryFirst={primaryThankYouFirst}
                calendlyUrl={calendlyUrl}
                offerUrl={offerUrlResolved}
                contextLabel={ctx.linkLabel}
                contextHref={contextHref}
                choice={answers.q8}
                onShowCodeAgain={
                  thankYouModalCode
                    ? () => setThankYouModalOpen(true)
                    : undefined
                }
              />
            </>
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
        relevant next step — demo, pricing, a thank-you offer, or a short call when
        it makes sense.
      </p>
      <button
        type="button"
        className="w-full rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 sm:w-auto sm:min-w-[8rem]"
        disabled={syncing}
        onClick={() => onStart()}
      >
        {syncing ? "Starting…" : "Start"}
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
        {syncing ? "Saving…" : nextLabel}
      </button>
    </div>
  )
}

function ThankYouCodeModal({
  open,
  onClose,
  code,
  calendlyUrl,
  offerPageUrl,
}: {
  open: boolean
  onClose: () => void
  code: string
  calendlyUrl: string
  offerPageUrl: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open || !code) return null

  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="thank-you-code-title"
        className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="thank-you-code-title"
          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Thank you — your code
        </p>
        <p className="mt-3 text-lg font-semibold text-neutral-900">
          Here’s your thank-you discount
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Copy and use at checkout or mention when you book.
        </p>
        <p className="mt-5 font-mono text-2xl font-semibold tracking-wide text-neutral-900">
          {code}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {copied ? "Copied" : "Copy code"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Got it
          </button>
        </div>
        {(isValidHttpUrl(calendlyUrl) || isValidHttpUrl(offerPageUrl)) && (
          <div className="mt-5 border-t border-neutral-100 pt-4 text-center text-sm">
            {isValidHttpUrl(calendlyUrl) ? (
              <a
                href={calendlyUrl.trim()}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-600"
              >
                Book a 15-minute call
              </a>
            ) : null}
            {isValidHttpUrl(calendlyUrl) && isValidHttpUrl(offerPageUrl) ? (
              <span className="mx-2 text-neutral-300" aria-hidden>
                ·
              </span>
            ) : null}
            {isValidHttpUrl(offerPageUrl) ? (
              <a
                href={offerPageUrl.trim()}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-600"
              >
                Open thank-you / offer page
              </a>
            ) : null}
          </div>
        )}
      </div>
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
  onShowCodeAgain,
}: {
  primaryFirst: boolean
  calendlyUrl: string
  offerUrl: string
  contextLabel: string
  contextHref: string
  choice: string | undefined
  onShowCodeAgain?: () => void
}) {
  /** Never use `#` or relative junk — always absolute https (matches main marketing site). */
  const ABSOLUTE_OFFER_FALLBACK = "https://leadagentsstudio.com/"
  const bookHref = isValidHttpUrl(calendlyUrl)
    ? calendlyUrl.trim()
    : SITE_CALENDLY_URL
  const offerHref = (() => {
    const o = offerUrl.trim()
    if (isValidHttpUrl(o)) return o
    const fb = SITE_SURVEY_OFFER_FALLBACK.trim()
    if (isValidHttpUrl(fb)) return fb
    return ABSOLUTE_OFFER_FALLBACK
  })()
  const contextSafe =
    isValidHttpUrl(contextHref) ? contextHref.trim() : siteDefaultContextUrl("demo")

  const book = (
    <a
      href={bookHref}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800"
    >
      Book a 15-minute session
    </a>
  )

  const offer = (
    <a
      href={offerHref}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
    >
      Claim the thank-you offer
    </a>
  )

  return (
    <div className="space-y-5 text-left">
      <h2 className="text-xl font-semibold leading-snug text-neutral-900 sm:text-2xl">
        You’re all set — thank you.
      </h2>
      <p className="text-sm text-neutral-600">
        {choice === "calendly"
          ? "When you’re ready, book a short call below."
          : choice === "discount"
            ? "Your code appeared in the pop-up. Use the link below if you need it again."
            : onShowCodeAgain
              ? "Your code appeared in the pop-up — open it again with the link below if needed."
              : "Next steps are below when you’re ready."}
      </p>

      {onShowCodeAgain ? (
        <button
          type="button"
          onClick={onShowCodeAgain}
          className="text-sm font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900"
        >
          Show code again
        </button>
      ) : null}

      {choice === "calendly" ? (
        <p className="text-sm text-neutral-600">
          Same calendar link we use across the site — pick a time that works for
          you.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1">
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
      <p className="pt-2 text-sm">
        <a
          href={contextSafe}
          target="_blank"
          rel="noreferrer"
          className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900"
        >
          {contextLabel}
        </a>
      </p>
    </div>
  )
}
