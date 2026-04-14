const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.3-70b-versatile',   // Best reasoning quality
  'llama-3.1-8b-instant',      // Fast fallback, higher rate limits
];

export const ask = async (prompt, maxTokens = 800, system = null) => {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.startsWith('gsk_your')) {
    throw new Error('GROQ_API_KEY not set. Get a free key at console.groq.com');
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  for (const model of MODELS) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens:  maxTokens,
          temperature: 0.5,
          stream:      false,
        }),
      });

      const d = await r.json();
      if (r.status === 429) continue;
      if (!r.ok || d.error) {
        if (r.status >= 500) continue;
        throw new Error(d.error?.message || 'HTTP ' + r.status);
      }
      const text = d.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      if (e.message.includes('429') || e.message.includes('rate')) continue;
      throw e;
    }
  }
  throw new Error('AI temporarily unavailable. Try again in a moment.');
};
