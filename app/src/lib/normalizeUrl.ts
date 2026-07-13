/**
 * Converts a bare phone number (e.g. "090 220 9200") into a tel: link so it
 * opens the phone dialer instead of trying to navigate as a web URL, and
 * prepends https:// to bare domains (e.g. "m.me/foo") — without a scheme,
 * browsers treat those as a relative path on our own site instead of an
 * external link. Leaves anything that already has a scheme untouched.
 */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^(https?:|tel:|mailto:)/i.test(trimmed)) return trimmed
  if (/^\+?[\d\s\-()]{6,20}$/.test(trimmed) && /\d/.test(trimmed)) {
    return `tel:${trimmed.replace(/[\s()-]/g, '')}`
  }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}
