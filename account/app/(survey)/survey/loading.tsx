export default function SurveyLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#fafaf9]"
      aria-busy="true"
      aria-label="Loading survey"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
        <p className="text-sm text-neutral-500">Loading survey...</p>
      </div>
    </div>
  )
}
