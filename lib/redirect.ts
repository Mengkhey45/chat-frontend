/**
 * Helpers for carrying a post-auth destination through the login/register/verify
 * chain — e.g. someone opening /invite/<id> while signed out should land back on
 * that invite once they have an account, not on /chat.
 */

const FALLBACK = '/chat'

/**
 * Only ever return a path on this site.
 *
 * `?redirect=` comes from the URL, so it is attacker-controlled. Without this
 * check, a link like `/login?redirect=https://evil.com` sends the user to an
 * attacker's page immediately after they authenticate — the classic open
 * redirect used to make phishing pages look legitimate.
 *
 * `//evil.com` and `/\evil.com` are protocol-relative URLs that browsers treat
 * as absolute, so a leading-slash test alone is not enough.
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value) return FALLBACK
  if (!value.startsWith('/')) return FALLBACK
  if (value.startsWith('//') || value.startsWith('/\\')) return FALLBACK
  return value
}

/** Append `?redirect=…` to an internal link, preserving the destination. */
export function withRedirect(path: string, redirect: string | null | undefined): string {
  if (!redirect) return path
  const safe = safeRedirect(redirect)
  if (safe === FALLBACK) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}redirect=${encodeURIComponent(safe)}`
}
