import type { VercelRequest, VercelResponse } from '@vercel/node';

const BUYMESHО_API = 'https://buymesho.onrender.com/api/validator/session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  }

  try {
    const upstream = await fetch(BUYMESHО_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: text || `BuyMesho returned HTTP ${upstream.status}` };
    }

    return res.status(upstream.status).json(payload);
  } catch (error) {
    console.error('Validator session proxy failed:', error);
    return res.status(502).json({ error: 'Unable to reach BuyMesho Validator session API' });
  }
}
