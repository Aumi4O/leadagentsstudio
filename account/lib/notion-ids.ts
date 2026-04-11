/** Normalize Notion database/page id for API (32 hex → hyphenated UUID). */
export function normalizeNotionDatabaseId(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  const hex = s.replace(/-/g, "")
  if (/^[0-9a-f]{32}$/i.test(hex)) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase()
  }
  return s
}
