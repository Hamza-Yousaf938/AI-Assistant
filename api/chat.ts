declare const process: {
  env: {
    GEMINI_API_KEY?: string;
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const message = (req.body?.message as string)?.toString().trim() ?? '';

  if (!message) {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set on server' });
  }

  try {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
      encodeURIComponent(apiKey);

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const detail = data?.error?.message || JSON.stringify(data) || 'Unknown error';
      return res.status(resp.status).json({ error: detail });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response text received from Gemini.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Gemini call failed:', err);
    return res.status(500).json({ error: 'Failed to fetch AI response' });
  }
}
