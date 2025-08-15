// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

dotenv.config();
const app = express();
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];

// Security middleware
app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '10mb' }));

// CSRF token generation
const csrfTokens = new Map();
app.get('/api/csrf-token', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    const ip = req.ip || req.connection.remoteAddress;
    csrfTokens.set(ip, { token, expires: Date.now() + 3600000 }); // 1 hour
    res.json({ csrfToken: token });
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Secure logging middleware
function sanitizeForLog(obj, depth = 0) {
    if (depth > 3) return '[MAX_DEPTH]';
    if (typeof obj === 'string') {
        return encodeURIComponent(obj).substring(0, 100);
    }
    if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'string') {
                sanitized[key] = encodeURIComponent(value).substring(0, 50);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeForLog(value, depth + 1);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    return obj;
}

app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        console.log('Headers:', sanitizeForLog(req.headers));
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Body:', sanitizeForLog(req.body));
        }
    }
    next();
});

const PORT = process.env.PORT || 5000;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

if (process.env.NODE_ENV === 'development') {
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('PORT:', PORT);
    console.log('OPENROUTER_KEY present:', !!OPENROUTER_KEY);
    console.log('OPENROUTER_KEY configured:', !!OPENROUTER_KEY);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('========================');
}

if (!OPENROUTER_KEY) {
    console.warn('⚠️ OPENROUTER_API_KEY not set in backend/.env — server will return sample responses for testing.');
} else {
    console.log('✅ OPENROUTER_API_KEY is configured');
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// === Improved system prompts ===
//
// 1) MCQ generator prompt: produce a short JSON array of questions (id, q, options[]).
// 2) Analyzer prompt: produce ONLY a JSON object with keys: summary, friendlyNote, urgency, possibleCauses, nextSteps, confidence.
//
// Both prompts include safety, short language, empathic style, 'cosmic references' allowed only as mild metaphors, and an explicit
// "if you're unsure or concerned, advise to seek urgent clinical care".

const MCQ_GENERATOR_SYSTEM_PROMPT = `
You are Symptom.ai's MCQ designer. The user gave a short symptom phrase or sentence.
Return a JSON array only (no text) of 3–5 multiple-choice questions to clarify the symptom.
Each question must be short (<= 60 characters), use simple language, and have 2–4 options.
Use keys: id (short ascii), q (text), options (array of strings).
Make questions high-value for diagnostic accuracy (onset, severity, associated symptoms, triggers).
Do NOT ask for PHI (no name, email, exact address). Keep tone neutral and friendly.
Example output:
[
  {"id":"onset","q":"Did pain start suddenly or slowly?","options":["Suddenly","Gradually"]},
  ...
]
`;

const MENTAL_MCQ_GENERATOR_SYSTEM_PROMPT = `
You are Symptom.ai's MCQ designer, specialized in mental wellness. The user wants to do a 'mind check-in'.
Return a JSON array only (no text) of 3-5 multiple-choice questions to clarify their state.
Focus on mood, energy, sleep, and recent changes.
Each question must be short (<= 60 characters), use simple, gentle language, and have 2-4 options.
Use keys: id (short ascii), q (text), options (array of strings).
Do NOT ask for PHI. Keep tone supportive and calm.
Example output:
[
  {"id":"mood","q":"How has your mood been recently?","options":["Generally positive","Mixed","Generally negative"]},
  ...
]
`;

const ANALYZER_SYSTEM_PROMPT = `
You are Symptom.ai, a friendly, safety-first medical guidance assistant focused on short, warm, useful explanations.
You MUST RETURN JSON ONLY (no extra prose) with EXACT keys:
{
  "summary": "<one-line friendly summary, 12-22 words>",
  "friendlyNote": "<one short friendly sentence with 0-2 emojis>",
  "urgency": "<LOW|MEDIUM|HIGH>",
  "possibleCauses": ["short phrase", "..."],
  "nextSteps": ["practical actionable steps (3-6)"],
  "confidence": "<percentage, e.g. 70%>"
}
Guidelines:
- Use the user's symptom + provided MCQ answers to produce a short evidence-based set of possible causes and next steps.
- Urgency: set HIGH if life-threatening features suggested (severe chest pain radiating to jaw/arm, sudden weakness, confusion, breathing difficulty, fainting).
- Use simple, empathetic language. Always include a reminder to seek emergency care for HIGH urgency.
- If uncertain, choose MEDIUM urgency and recommend seeing a clinician.
- Do NOT give a definitive diagnosis nor provide prescription advice.
- If user mentions mental health crisis or self-harm, prioritize safety instructions and urgent help.
- You may include mild cosmic metaphors (1 short line) only if it helps reassurance — never replace clinical advice.
Return only the JSON object. Example:
{
 "summary":"You may have a tension-type headache. Hydration and rest can help.",
 "friendlyNote":"Take a deep breath — small steps count! 🌿",
 "urgency":"LOW",
 "possibleCauses":["Tension","Dehydration","Poor sleep"],
 "nextSteps":["Drink water","Rest for 1–2 hours","Try breathing exercise"],
 "confidence":"70%"
}
`;

const MENTAL_ANALYZER_SYSTEM_PROMPT = `
You are Symptom.ai, a friendly, safety-first mental wellness assistant.
You MUST RETURN JSON ONLY (no extra prose) with EXACT keys:
{
  "summary": "<one-line gentle summary, 12-22 words>",
  "friendlyNote": "<one short supportive sentence with 0-2 emojis>",
  "urgency": "<LOW|MEDIUM|HIGH>",
  "possibleCauses": ["short phrase", "..."],
  "nextSteps": ["practical actionable steps (3-6), focus on self-care, mindfulness, and seeking support"],
  "confidence": "<percentage, e.g. 70%>"
}
Guidelines:
- Use the user's check-in topic + provided MCQ answers.
- Urgency: set HIGH ONLY if self-harm or crisis is clearly indicated.
- Use simple, empathetic, non-clinical language.
- If HIGH urgency, the first step MUST be to contact a crisis line or emergency services.
- Do NOT give a definitive diagnosis (e.g., "Depression"). Instead, describe patterns (e.g., "a pattern of low mood and energy").
- If user mentions crisis or self-harm, prioritize safety instructions.
Return only the JSON object.
`;

// helper to call openrouter
async function callOpenRouter(messages, opts = {}) {
    if (!OPENROUTER_KEY) {
        console.log('No OPENROUTER_KEY found, returning null');
        return null;
    }
    
    try {
        const payload = {
            model: opts.model || 'openai/gpt-3.5-turbo',
            messages,
            max_tokens: opts.max_tokens || 400,
            temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Calling OpenRouter with payload:', sanitizeForLog(payload));
        }
        
        const resp = await axios.post(OPENROUTER_URL, payload, {
            headers: { 
                Authorization: `Bearer ${OPENROUTER_KEY}`, 
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'Symptom.ai'
            },
            timeout: 15000
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.log('OpenRouter response status:', resp.status);
        }
        return resp.data;
    } catch (err) {
        console.error('=== OPENROUTER ERROR ===');
        console.error('Error message:', encodeURIComponent(err.message || ''));
        console.error('Error code:', err.code);
        
        // Network errors (DNS, connection issues)
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            console.error('Network connectivity issue with OpenRouter API');
            return null; // Return null instead of throwing for network issues
        }
        
        console.error('Response status:', err.response?.status);
        console.error('Response data:', sanitizeForLog(err.response?.data));
        console.error('=====================');
        throw err;
    }
}

// Enhanced CSRF protection middleware
function csrfProtection(req, res, next) {
    const token = req.get('X-CSRF-Token');
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!token) {
        return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const storedToken = csrfTokens.get(ip);
    if (!storedToken || storedToken.token !== token || Date.now() > storedToken.expires) {
        csrfTokens.delete(ip);
        return res.status(403).json({ error: 'Invalid or expired CSRF token' });
    }
    
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Forbidden origin' });
    }
    
    next();
}

// Memory-efficient rate limiting with cleanup
const rateLimitMap = new Map();

// Cleanup expired entries every 5 minutes
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
        if (now > data.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
    // Also cleanup expired CSRF tokens
    for (const [ip, data] of csrfTokens.entries()) {
        if (now > data.expires) {
            csrfTokens.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// Cleanup on process exit
process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
});
process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
});

function customRateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }
    
    const limit = rateLimitMap.get(ip);
    if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + windowMs;
        return next();
    }
    
    if (limit.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    limit.count++;
    next();
}

// Simple API key authentication for demo purposes
const API_KEYS = new Set([process.env.API_KEY || 'demo-key-12345']);

function requireAuth(req, res, next) {
    const apiKey = req.get('X-API-Key');
    const origin = req.get('Origin') || req.get('Referer');
    
    // Allow requests from allowed origins without API key (for frontend)
    if (origin && allowedOrigins.includes(origin)) {
        return next();
    }
    
    // Require API key for other requests
    if (!apiKey || !API_KEYS.has(apiKey)) {
        return res.status(401).json({ error: 'Valid API key required' });
    }
    
    next();
}

// Health check endpoint
app.get('/api/health', requireAuth, (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Quick query endpoint
const quickQueryRouter = require('./routes/quickQuery');
app.use('/api/quick-query', requireAuth, csrfProtection, customRateLimit, quickQueryRouter);

// Cosmic insight endpoint
const cosmicInsightRouter = require('./routes/cosmicInsight');
app.use('/api/cosmic-insight', requireAuth, csrfProtection, customRateLimit, cosmicInsightRouter);


// Endpoint: generate MCQs (AI)
app.post('/api/generate-mcqs', requireAuth, csrfProtection, customRateLimit, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('MCQ request body:', sanitizeForLog(req.body));
        }
        const { symptom, type } = req.body || {};
        if (!symptom || typeof symptom !== 'string') {
            return res.status(400).json({ error: 'symptom required and must be a string' });
        }

        // Decode URL-encoded symptom
        const decodedSymptom = decodeURIComponent(symptom.trim());
        if (process.env.NODE_ENV === 'development') {
            console.log('Processing symptom:', sanitizeForLog(decodedSymptom));
        }

        // If no API key, return a safe sample
        if (!OPENROUTER_KEY) {
            const sample = [
                { id: 'onset', q: 'Did this start suddenly or gradually?', options: ['Suddenly', 'Gradually'] },
                { id: 'severity', q: 'How bad is the pain now?', options: ['Mild', 'Moderate', 'Severe'] },
                { id: 'assoc', q: 'Any other symptoms (fever/breathing issues)?', options: ['Yes', 'No'] }
            ];
            return res.json({ questions: sample, debug: 'sample because no API key' });
        }

        const system_prompt = type === 'mental'
            ? MENTAL_MCQ_GENERATOR_SYSTEM_PROMPT
            : MCQ_GENERATOR_SYSTEM_PROMPT;

        const messages = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: `Symptom: ${decodedSymptom}\nReturn JSON array of MCQs.` }
        ];

        const apiRes = await callOpenRouter(messages, { max_tokens: 200 });
        
        // If API call failed (network issues), return fallback
        if (!apiRes) {
            console.log('OpenRouter API call failed, returning fallback questions');
            return res.json({
                questions: [
                    { id: 'onset', q: 'When did this start?', options: ['Today', 'This week', 'Longer ago'] },
                    { id: 'severity', q: 'How severe is it?', options: ['Mild', 'Moderate', 'Severe'] },
                    { id: 'duration', q: 'How long does it last?', options: ['Minutes', 'Hours', 'All day'] }
                ],
                fallback: true
            });
        }
        
        const content = apiRes?.choices?.[0]?.message?.content || apiRes?.choices?.[0]?.text || '';
        // try to parse JSON array
        let parsed = null;
        try { parsed = JSON.parse(content); } catch (e) {
            const match = content.match(/\[[\s\S]*\]/);
            if (match) {
                try { parsed = JSON.parse(match[0]); } catch (e2) { parsed = null; }
            }
        }
        if (!parsed) {
            // fallback to conservative sample
            return res.json({
                questions: [
                    { id: 'onset', q: 'Did this start suddenly or gradually?', options: ['Suddenly', 'Gradually'] },
                    { id: 'severity', q: 'How bad is it now?', options: ['Mild', 'Moderate', 'Severe'] },
                    { id: 'assoc', q: 'Other symptoms (fever/breathing)?', options: ['Yes', 'No'] }
                ],
                raw: content
            });
        }
        return res.json({ questions: parsed });
    } catch (err) {
        console.error('=== GENERATE-MCQS ERROR ===');
        console.error('Full error stack:', sanitizeForLog(err.stack || 'No stack trace available'));
        console.error('Error message:', sanitizeForLog(err.message));
        console.error('Response data:', sanitizeForLog(err.response?.data));
        console.error('Request body was:', sanitizeForLog(req.body));
        console.error('========================');
        
        return res.status(500).json({ 
            error: 'Failed to generate questions', 
            details: err.message || 'Unknown error',
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
            questions: [
                { id: 'onset', q: 'When did this start?', options: ['Today', 'This week', 'Longer ago'] },
                { id: 'severity', q: 'How severe is it?', options: ['Mild', 'Moderate', 'Severe'] }
            ]
        });
    }
});

// Endpoint: analyze (updated prompt)
app.post('/api/analyze', requireAuth, csrfProtection, customRateLimit, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('Analyze request body:', sanitizeForLog(req.body));
        }
        const { symptom, answers } = req.body || {};
        if (!symptom || typeof symptom !== 'string') {
            return res.status(400).json({ error: 'symptom required and must be a string' });
        }
        
        // Decode URL-encoded symptom
        const decodedSymptom = decodeURIComponent(symptom.trim());
        if (process.env.NODE_ENV === 'development') {
            console.log('Processing symptom for analysis:', sanitizeForLog(decodedSymptom));
        }

        // Build context combining symptom and MCQ answers
        let userContext = `Symptom: ${decodedSymptom}\n`;
        if (answers && typeof answers === 'object') {
            userContext += 'MCQ answers:\n';
            for (const [k, v] of Object.entries(answers)) {
                userContext += `- ${k}: ${v}\n`;
            }
        }

        if (!OPENROUTER_KEY) {
            // sample structured response for local testing
            const sample = {
                summary: "You may have a mild viral illness or low-grade fever. Rest and fluids help.",
                friendlyNote: "Hang in there — rest and water are simple wins! 💧",
                urgency: "LOW",
                possibleCauses: ["Viral infection", "Mild dehydration", "Allergic reaction"],
                nextSteps: ["Drink fluids", "Rest", "If fever > 38.5°C or breathing difficulties, see doctor"],
                confidence: "60%"
            };
            return res.json({ result: sample, debug: 'no API key - sample' });
        }

        const messages = [
            { role: 'system', content: ANALYZER_SYSTEM_PROMPT },
            { role: 'user', content: userContext }
        ];

        const apiRes = await callOpenRouter(messages, { max_tokens: 400 });
        
        // If API call failed (network issues), return fallback
        if (!apiRes) {
            console.log('OpenRouter API call failed for analysis, returning fallback');
            return res.json({
                result: {
                    summary: `You reported: ${decodedSymptom}. Consider rest and monitoring symptoms.`,
                    friendlyNote: "Take care of yourself! 🌟",
                    urgency: "MEDIUM",
                    possibleCauses: ["Various causes possible", "Consult healthcare provider"],
                    nextSteps: ["Monitor symptoms", "Rest and hydrate", "Consult doctor if worsening"],
                    confidence: "50%"
                },
                fallback: true
            });
        }
        
        const content = apiRes?.choices?.[0]?.message?.content || apiRes?.choices?.[0]?.text || '';
        // parse JSON object
        let parsed = null;
        try { parsed = JSON.parse(content); } catch (e) {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                try { parsed = JSON.parse(match[0]); } catch (e2) { parsed = null; }
            }
        }
        if (!parsed) {
            // last-resort soft parse: return content fallback
            return res.json({
                result: {
                    summary: content.slice(0, 220),
                    friendlyNote: "I'm not fully certain — check with a clinician if concerned.",
                    urgency: "MEDIUM",
                    possibleCauses: [],
                    nextSteps: [],
                    confidence: "50%"
                },
                raw: content
            });
        }
        return res.json({ result: parsed });
    } catch (err) {
        console.error('=== ANALYZE ERROR ===');
        console.error('Full error stack:', sanitizeForLog(err.stack || 'No stack trace available'));
        console.error('Error message:', sanitizeForLog(err.message));
        console.error('Response data:', sanitizeForLog(err.response?.data));
        console.error('Request body was:', sanitizeForLog(req.body));
        console.error('==================');
        
        return res.status(500).json({ 
            error: 'Analysis failed', 
            details: err.message || 'Unknown error',
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        });
    }
});

app.get('/', (req, res) => {
    res.send('Symptom.ai backend up');
});

app.listen(PORT, () => {
    console.log(`✅ Symptom.ai backend running on http://localhost:${PORT}`);
});
