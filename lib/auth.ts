import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Lightweight, dependency-free session auth for the Pi Auctions app.
 *
 * Flow:
 *  1. Client runs Pi.authenticate() and receives an accessToken.
 *  2. Client POSTs the accessToken to /api/auth/pi-login.
 *  3. Server verifies the token against the Pi API (/v2/me), then issues an
 *     HMAC-signed session token stored in an HttpOnly cookie.
 *  4. Subsequent API routes call requireAuth() to read the verified identity.
 *
 * The session token is a signed payload — it is NOT encrypted, so never put
 * anything secret in it (uid + username are fine, they are public identifiers).
 */

export interface Session {
  uid: string;
  username: string;
  exp: number; // epoch seconds
}

const COOKIE_NAME = 'pa_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly in production; a missing secret means unsigned/forgeable sessions.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET (or JWT_SECRET) must be set in production.');
    }
    return 'insecure-dev-secret-do-not-use-in-production';
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payload: string): string {
  return base64url(crypto.createHmac('sha256', getSecret()).update(payload).digest());
}

/** Create a signed session token for a verified Pi user. */
export function createSessionToken(user: { uid: string; username: string }): string {
  const body: Session = {
    uid: user.uid,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = base64url(JSON.stringify(body));
  return `${payload}.${sign(payload)}`;
}

/** Verify a signed session token; returns the session or null. */
export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()) as Session;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!session.uid || !session.username) return null;
    return session;
  } catch {
    return null;
  }
}

/** Read and verify the session from the request cookies (no side effects). */
export function getSession(req: NextApiRequest): Session | null {
  const token = req.cookies?.[COOKIE_NAME];
  return verifySessionToken(token);
}

/**
 * Enforce authentication. Returns the session, or sends 401 and returns null.
 * Callers should `return` immediately when this returns null.
 */
export function requireAuth(req: NextApiRequest, res: NextApiResponse): Session | null {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized. Please sign in with Pi.' });
    return null;
  }
  return session;
}

/** Admin check against the ADMIN_UIDS allowlist (uid or username). */
export function isAdmin(session: Session): boolean {
  const list = (process.env.ADMIN_UIDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(session.uid) || list.includes(session.username);
}

export function requireAdmin(req: NextApiRequest, res: NextApiResponse): Session | null {
  const session = requireAuth(req, res);
  if (!session) return null;
  if (!isAdmin(session)) {
    res.status(403).json({ error: 'Forbidden. Admin access required.' });
    return null;
  }
  return session;
}

/** Set the session cookie on the response. */
export function setSessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`,
  );
}

/** Clear the session cookie. */
export function clearSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
}

/**
 * Verify a Pi access token against the Pi Platform API.
 * Returns the authenticated { uid, username } or null.
 */
export async function verifyPiAccessToken(accessToken: string): Promise<{ uid: string; username: string } | null> {
  if (!accessToken) return null;
  try {
    const resp = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const me: any = await resp.json();
    if (!me?.uid) return null;
    return { uid: me.uid, username: (me.username || '').replace('@', '') };
  } catch (err) {
    console.error('verifyPiAccessToken failed:', err);
    return null;
  }
}
