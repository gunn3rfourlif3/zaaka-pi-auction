import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPiAccessToken, createSessionToken, setSessionCookie } from '../../../lib/auth';
import { rateLimit } from '../../../lib/rateLimit';

/**
 * Exchange a Pi accessToken (from Pi.authenticate on the client) for a
 * server-issued session cookie. The token is verified against the Pi API,
 * so identity cannot be spoofed by the client.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { name: 'pi-login', max: 20, windowMs: 5 * 60 * 1000 })) return;

  const { accessToken } = req.body || {};
  if (!accessToken || typeof accessToken !== 'string') {
    return res.status(400).json({ error: 'Missing accessToken' });
  }

  const user = await verifyPiAccessToken(accessToken);
  if (!user) {
    return res.status(401).json({ error: 'Invalid Pi access token' });
  }

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  return res.status(200).json({ authenticated: true, user });
}
