import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quick Fit Check",
  description:
    "Short questionnaire — no sign-in required. Optional contact on the last step only.",
}

/**
 * Isolated shell: neutral background + system stack so the survey feels like a
 * simple form, not the full account app.
 */
export default function SurveyLayout({ children }: React.PropsWithChildren) {
  return (
    <div
      className="min-h-screen bg-[#fafaf9] text-neutral-900 antialiased [font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]"
    >
      {children}
    </div>
  )
}
