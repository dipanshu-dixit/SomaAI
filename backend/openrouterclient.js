// backend/openrouterClient.js
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

async function getAIResponse(prompt) {
  if (!API_KEY) throw new Error('OPENROUTER_API_KEY missing in .env');

  try {
    const payload = {
      model: 'openai/gpt-3.5-turbo', // safe default; change later if you want
      messages: [
        { role: 'system', content: 'You are an empathetic, concise medical assistant. Provide clear guidance and recommend urgent care when needed.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600
    };

    const res = await axios.post(OPENROUTER_URL, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // handle common shapes
    const data = res.data || {};
    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.result;
    return text || 'No response from AI.';
  } catch (err) {
    // give useful debugging info in server logs
    console.error('OpenRouter API error:', err.response?.data || err.message || err);
    throw new Error('OpenRouter API error');
  }
}

module.exports = { getAIResponse };
