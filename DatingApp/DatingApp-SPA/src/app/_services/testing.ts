import { TokenClaims } from './jwt';

/** Builds an unsigned JWT-shaped string; the SPA only ever reads the payload. */
export function fakeToken(claims: Partial<TokenClaims> = {}): string {
  const payload = {
    nameid: '7',
    unique_name: 'lola',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  };
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS512', typ: 'JWT' })}.${encode(payload)}.signature`;
}
