// backend/aiFlow.js
const { callOpenRouter, safeParseJsonFromText } = require('./openrouterClient');

// Configuration constants
const AI_CONFIG = {
    MCQ_TEMPERATURE: 0.2,
    MCQ_MAX_TOKENS: 450,
    ANALYSIS_TEMPERATURE: 0.2,
    ANALYSIS_MAX_TOKENS: 900,
    HUMANIZE_TEMPERATURE: 0.75,
    HUMANIZE_MAX_TOKENS: 400
};

// System prompts as constants for better maintainability
const PROMPTS = {
    MCQ_GENERATOR: (symptom) => `
You are SomaAI assistant. Given a user's symptom text, produce a SHORT list of 3 or 4 multiple-choice questions to clarify the problem.
Output MUST be valid JSON and nothing else, exactly:
{
  "questions": [
    {"id": "q1", "text": "...", "options": [{"id":"a","label":"..."}, {"id":"b","label":"..."}]},
    ...
  ]
}
Rules:
- Each question should be max 10–12 words.
- Use extremely simple language (user-friendly).
- Options should be 2–4 choices, short labels (1–4 words).
- Prioritize questions that change the likely cause / urgency.
- No medical jargon.
Now produce JSON for this symptom:
"""${symptom}"""
  `,
    
    STRUCTURED_ANALYSIS: (symptom, answers) => `
You are SomaAI — a careful medical assistant. Return VALID JSON only with this exact schema:
{
  "summary":"1-3 sentence plain-language summary",
  "possible_causes":[{"title":"...", "brief":"1-line explanation"}],
  "next_steps":[{"action":"...", "why":"1-line reason"}],
  "urgency":"LOW|MEDIUM|HIGH",
  "grounding":["..."], // optional array if anxiety present
  "cosmic": true|false
}
Rules:
- Use the symptom and the provided MCQ answers to be precise.
- Keep language simple and actionable.
- If HIGH urgency, include what to do immediately in next_steps (e.g., "call emergency").
Now produce JSON using:
symptom: """${symptom}"""
answers: ${JSON.stringify(answers)}
`,
    
    HUMANIZE_RESPONSE: (structuredData) => `
You are SomaAI persona editor. You will be given the JSON object (pass1).
Rewrite ONLY two fields:
- "summary": make it warm, vivid, Gen-Z friendly (1-3 sentences), include 1–2 emojis.
- add "friendly": short supportive line (1 sentence) that feels like a caring friend.

Do NOT change possible_causes, next_steps, urgency, grounding, cosmic.
Respond with JSON only, same keys as original, with updated summary and friendly.
Original JSON:
${JSON.stringify(structuredData, null, 2)}
`
};

// Input validation helper
function validateSymptom(symptom) {
    if (!symptom || typeof symptom !== 'string' || symptom.trim().length === 0) {
        throw new Error('Invalid symptom: must be a non-empty string');
    }
}

// Enhanced error handling wrapper
async function handleAICall(operation, prompt, config) {
    try {
        const result = await callOpenRouter([{ role: 'system', content: prompt }], config);
        return safeParseJsonFromText(result);
    } catch (error) {
        console.error(`Error in ${operation}:`, error.message);
        throw new Error(`Failed to ${operation}: ${error.message}`);
    }
}

async function generateMCQs(symptom) {
    validateSymptom(symptom);
    
    const prompt = PROMPTS.MCQ_GENERATOR(symptom);
    const config = { 
        temperature: AI_CONFIG.MCQ_TEMPERATURE, 
        max_tokens: AI_CONFIG.MCQ_MAX_TOKENS 
    };
    
    return handleAICall('generate MCQs', prompt, config);
}

// Data normalization helper
function normalizeStructuredData(data) {
    return {
        ...data,
        possible_causes: Array.isArray(data.possible_causes) ? data.possible_causes : [],
        next_steps: Array.isArray(data.next_steps) ? data.next_steps : [],
        urgency: String(data.urgency || 'LOW').toUpperCase(),
        grounding: Array.isArray(data.grounding) ? data.grounding : [],
        cosmic: !!data.cosmic
    };
}

// Fallback data generator
function createFallbackResponse(structuredData) {
    return {
        ...structuredData,
        friendly: structuredData.friendly || "Take care — watch symptoms and seek care if worse. 💙",
        summary: structuredData.summary || "Briefly: " + (structuredData.possible_causes[0]?.title || 'See causes below.')
    };
}

// Merge structured and humanized data safely
function mergeAnalysisData(structured, humanized) {
    return {
        ...humanized,
        possible_causes: humanized.possible_causes || structured.possible_causes,
        next_steps: humanized.next_steps || structured.next_steps,
        urgency: humanized.urgency || structured.urgency,
        grounding: humanized.grounding || structured.grounding,
        cosmic: typeof humanized.cosmic === 'boolean' ? humanized.cosmic : structured.cosmic
    };
}

// Pass 1: Generate structured analysis
async function generateStructuredAnalysis(symptom, answers) {
    const prompt = PROMPTS.STRUCTURED_ANALYSIS(symptom, answers);
    const config = { 
        temperature: AI_CONFIG.ANALYSIS_TEMPERATURE, 
        max_tokens: AI_CONFIG.ANALYSIS_MAX_TOKENS 
    };
    
    try {
        const result = await handleAICall('generate structured analysis', prompt, config);
        return normalizeStructuredData(result);
    } catch (error) {
        const errorMsg = error.stack || error.message || String(error);
        throw new Error('Failed to parse structured result from AI: ' + errorMsg);
    }
}

// Pass 2: Humanize the response
async function humanizeResponse(structuredData) {
    const prompt = PROMPTS.HUMANIZE_RESPONSE(structuredData);
    const config = { 
        temperature: AI_CONFIG.HUMANIZE_TEMPERATURE, 
        max_tokens: AI_CONFIG.HUMANIZE_MAX_TOKENS 
    };
    
    try {
        const humanized = await handleAICall('humanize response', prompt, config);
        return mergeAnalysisData(structuredData, humanized);
    } catch (error) {
        const errorMsg = error.stack || error.message || String(error);
        console.warn('Humanization failed, using fallback:', errorMsg);
        return createFallbackResponse(structuredData);
    }
}

// Main analysis function: two-pass (structured JSON pass then humanize summary+friendly)
async function finalizeAnalysis(symptom, answers) {
    validateSymptom(symptom);
    
    // Pass 1: Generate structured analysis
    const structuredData = await generateStructuredAnalysis(symptom, answers);
    
    // Pass 2: Humanize the response
    return await humanizeResponse(structuredData);
}

module.exports = { generateMCQs, finalizeAnalysis };