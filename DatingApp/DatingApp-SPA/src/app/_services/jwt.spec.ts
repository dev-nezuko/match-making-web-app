import { decodeToken, isExpired } from './jwt';
import { fakeToken } from './testing';

describe('jwt helpers', () => {
  it('reads the claims from a token payload', () => {
    const claims = decodeToken(fakeToken({ nameid: '42', unique_name: 'roy' }));

    expect(claims?.nameid).toBe('42');
    expect(claims?.unique_name).toBe('roy');
  });

  it('returns null for something that is not a token', () => {
    expect(decodeToken('not-a-token')).toBeNull();
    expect(decodeToken('a.%%%.c')).toBeNull();
  });

  it('treats a missing or past expiry as expired', () => {
    const now = Date.now();
    expect(isExpired(null)).toBe(true);
    expect(isExpired(decodeToken(fakeToken({ exp: now / 1000 - 1 })), now)).toBe(true);
    expect(isExpired(decodeToken(fakeToken({ exp: now / 1000 + 60 })), now)).toBe(false);
  });
});
