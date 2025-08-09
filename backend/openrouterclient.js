// backend/openrouterClient.js
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set in .env');
}

async function getAIResponse(prompt) {
  if (!API_KEY) throw new Error('OpenRouter API key missing. Set OPENROUTER_API_KEY in .env');

  try {
    const payload = {
      model: 'openai/gpt-3.5-turbo', // safe default; change to a model you prefer
      messages: [
        { role: 'system', content: 'You are an empathetic, concise medical assistant. Provide clear, non-alarming guidance and advise to seek immediate help if needed.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600
    };

    const res = await axios.post(OPENROUTER_URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30_000
    });

    // Try common shapes of response
    const body = res.data || {};
    const choiceText = body?.choices?.[0]?.message?.content || body?.result || body?.choices?.[0]?.text;

    return choiceText ?? 'No response from AI.';
  } catch (err) {
    // bubble up helpful error
    const msg = err?.response?.data || err.message || String(err);
    console.error('OpenRouter request failed:', msg);
    throw new Error('OpenRouter API error: ' + (err?.response?.status || err.message));
  }
}

module.exports = { getAIResponse };
