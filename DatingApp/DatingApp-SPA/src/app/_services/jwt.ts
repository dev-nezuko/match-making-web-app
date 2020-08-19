export interface TokenClaims {
  nameid: string;
  unique_name: string;
  exp: number;
}

/** Reads the payload of a JWT. The signature is the API's business, not ours. */
export function decodeToken(token: string): TokenClaims | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as TokenClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: TokenClaims | null, now = Date.now()): boolean {
  return !claims || claims.exp * 1000 <= now;
}
