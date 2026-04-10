import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quick Fit Check — Lead Agents Studio",
  description:
    "A short fit check so we can point you to the right offer and next step.",
}

export default function SurveyLayout({ children }: React.PropsWithChildren) {
  return children
}
