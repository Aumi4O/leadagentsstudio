/** Minimal shell so first paint matches the survey (no flash of account chrome). */
export default function SurveyLoading() {
  return (
    <div
      className="min-h-screen bg-[#fafaf9]"
      aria-busy="true"
      aria-label="Loading survey"
    />
  )
}
