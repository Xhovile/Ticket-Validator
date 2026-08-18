const BUYMESHO_API = 'https://buymesho.onrender.com/api/validator/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!code || code.length > 256) {
    return res.status(400).json({ error: 'A valid Ticket Validator handoff code is required' });
  }

  try {
    const upstream = await fetch(BUYMESHO_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const text = await upstream.text();
    let payload;
    try { payload = text ? JSON.parse(text) : {}; }
    catch { payload = { error: text || `BuyMesho returned HTTP ${upstream.status}` }; }
    return res.status(upstream.status).json(payload);
  } catch (error) {
    console.error('Validator session proxy failed:', error);
    return res.status(502).json({ error: 'Unable to reach BuyMesho Validator session API' });
  }
}
