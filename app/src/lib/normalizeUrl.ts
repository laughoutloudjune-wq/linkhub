/**
 * Converts a bare phone number (e.g. "090 220 9200") into a tel: link so it
 * opens the phone dialer instead of trying to navigate as a web URL. Leaves
 * anything that already has a scheme, or doesn't look like a phone number,
 * untouched.
 */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^(https?:|tel:|mailto:)/i.test(trimmed)) return trimmed
  if (/^\+?[\d\s\-()]{6,20}$/.test(trimmed) && /\d/.test(trimmed)) {
    return `tel:${trimmed.replace(/[\s()-]/g, '')}`
  }
  return trimmed
}
