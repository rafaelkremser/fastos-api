// An origin is scheme + host (+ port), with no path or trailing slash. A
// leading "*." matches one subdomain level: each tenant has its own subdomain.
export const CORS_ORIGIN_PATTERN =
  /^https?:\/\/(\*\.)?([a-z0-9-]+\.)*[a-z0-9-]+(:\d{1,5})?$/i

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createOriginMatcher(allowedOrigins: string[]) {
  const exact = new Set<string>()
  const wildcards: RegExp[] = []

  for (const allowed of allowedOrigins.map((origin) => origin.toLowerCase())) {
    const [scheme, host] = allowed.split('://*.')

    if (host === undefined) {
      exact.add(allowed)
    } else {
      wildcards.push(
        new RegExp(`^${scheme}://[a-z0-9-]+\\.${escapeRegExp(host)}$`),
      )
    }
  }

  return (origin: string) => {
    const normalized = origin.toLowerCase()
    return (
      exact.has(normalized) ||
      wildcards.some((pattern) => pattern.test(normalized))
    )
  }
}
