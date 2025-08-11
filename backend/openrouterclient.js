// backend/openrouterClient.js
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set in backend/.env');
}

async function analyzeWithOpenRouter(symptoms) {
  const prompt = `
You are a careful, empathetic medical assistant. Respond ONLY with a valid JSON object (no extra commentary).
Return these fields:
{
  "summary": "short plain-language summary (1-2 sentences) with at least one emoji",
  "possible_causes": ["cause1", "cause2", ...],
  "urgency": "low" | "medium" | "high",
  "next_steps": ["step1", "step2", ...],
  "friendly": "short conversational reply w/ emojis",
  "cosmic": true | false,
  "grounding": ["step1", "step2"] // OPTIONAL, include if anxiety detected
}

Important:
- Use cautious language ("might be", "could be").
- If the text contains panic/anxiety signals, include grounding array.
- Do NOT return any extra text outside the JSON.
Symptoms: ${symptoms}
  `;

  const body = {
    model: 'openai/gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful medical assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 600
  };

  try {
    const res = await axios.post(OPENROUTER_URL, body, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const text =
      res?.data?.choices?.[0]?.message?.content ||
      res?.data?.choices?.[0]?.text ||
      JSON.stringify(res?.data);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        const jsonStr = text.substring(first, last + 1);
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          parsed = null;
        }
      } else {
        parsed = null;
      }
    }

    if (!parsed) {
      // Fallback: return a default response
      return {
        summary: 'Sorry, the AI could not process your symptoms. Please try again later.',
        possible_causes: [],
        urgency: 'low',
        next_steps: ['Try rephrasing your symptoms or check your internet connection.'],
        friendly: '',
        cosmic: false,
        grounding: []
      };
    }

    const safe = {
      summary: parsed.summary || 'No summary available.',
      possible_causes: parsed.possible_causes || [],
      urgency: parsed.urgency || 'low',
      next_steps: parsed.next_steps || [],
      friendly: parsed.friendly || '',
      cosmic: parsed.cosmic === true,
      grounding: parsed.grounding || []
    };

    return safe;
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message || err);
    // Return a fallback error response
    return {
      summary: 'AI service error: ' + (err.response?.data?.error || err.message || 'Unknown error'),
      possible_causes: [],
      urgency: 'low',
      next_steps: ['Please check your API key and internet connection.'],
      friendly: '',
      cosmic: false,
      grounding: []
    };
  }
}

module.exports = { analyzeWithOpenRouter };
