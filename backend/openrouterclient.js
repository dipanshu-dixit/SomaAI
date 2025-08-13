// backend/openrouterClient.js
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Get API key
function getApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENROUTER_API_KEY missing in backend/.env');
    }
    return apiKey;
}

async function callOpenRouter(messages, opts = {}) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required but not configured');
  }
  
  const payload = {
    model: opts.model || 'openai/gpt-3.5-turbo',
    messages,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
    max_tokens: opts.max_tokens || 800
  };
  
  try {
    const res = await axios.post(OPENROUTER_URL, payload, {
      headers: { 
        Authorization: `Bearer ${apiKey}`, 
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://symptom.ai',
        'X-Title': 'SymptomAI'
      },
      timeout: 15000
    });
    
    const content = res.data?.choices?.[0]?.message?.content ?? res.data?.choices?.[0]?.text ?? JSON.stringify(res.data);
    return content;
  } catch (error) {
    console.error('OpenRouter API error:', error.message);
    throw error;
  }
}

// helper: find JSON within text
function safeParseJsonFromText(text) {
  if (!text) throw new Error('No text to parse');
  try { 
    return JSON.parse(text); 
  } catch (e) {
    const first = text.indexOf('{'), last = text.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error('No JSON found');
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch (e2) {
      throw new Error('Invalid JSON format in extracted text');
    }
  }
}

module.exports = { callOpenRouter, safeParseJsonFromText };