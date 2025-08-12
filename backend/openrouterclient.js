// backend/openrouterClient.js

// Lazy loading modules to improve startup performance
let axios;
let dotenvConfigured = false;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Lazy load and configure dotenv only when needed
function ensureDotenvConfigured() {
    if (!dotenvConfigured) {
        require('dotenv').config();
        dotenvConfigured = true;
    }
}

// Lazy load axios only when needed
function getAxios() {
    if (!axios) {
        axios = require('axios');
    }
    return axios;
}

// Get API key with lazy dotenv loading
function getApiKey() {
    ensureDotenvConfigured();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENROUTER_API_KEY missing in backend/.env');
    }
    return apiKey;
}

async function callOpenRouter(messages, opts = {}) {
  // Lazy load dependencies only when function is called
  const axiosInstance = getAxios();
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
  
  const res = await axiosInstance.post(OPENROUTER_URL, payload, {
    headers: { 
      Authorization: `Bearer ${apiKey}`, 
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://symptom.ai',
      'X-Title': 'SymptomAI'
    },
    timeout: 30000
  });
  
  const content = res.data?.choices?.[0]?.message?.content ?? res.data?.choices?.[0]?.text ?? JSON.stringify(res.data);
  return content;
}

// helper: find JSON within text
function safeParseJsonFromText(text) {
  if (!text) throw new Error('No text to parse');
  try { return JSON.parse(text); } catch (e) {
    const first = text.indexOf('{'), last = text.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error('No JSON found');
    return JSON.parse(text.slice(first, last + 1));
  }
}

module.exports = { callOpenRouter, safeParseJsonFromText };