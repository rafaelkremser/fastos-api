export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

// Both tokens share a signing key; the type keeps one from being used as the
// other: a refresh token cannot call the API and an access token cannot renew
export type TokenType = 'access' | 'refresh'

export interface RefreshTokenClaims {
  sub: string
  tenantId: string
  type: 'refresh'
}

export function isRefreshTokenClaims(
  claims: Record<string, unknown> | null,
): claims is Record<string, unknown> & RefreshTokenClaims {
  return (
    claims !== null &&
    claims.type === 'refresh' &&
    typeof claims.sub === 'string' &&
    typeof claims.tenantId === 'string'
  )
}
