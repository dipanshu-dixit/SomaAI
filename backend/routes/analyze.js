// backend/routes/analyze.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

// Move system prompt to module level for performance
const SYSTEM_PROMPT = `
You are SymptomAI — a friendly, approachable, Gen Z medical assistant.  
Your job:
- Explain possible conditions in short, casual sentences with emojis.
- Use a warm, human-like tone.
- At moments when something feels serious or emotional, add a brief "cosmic mode" insight — inspired by meditation, Bhagavad Gita, stoicism, or cosmic metaphors.
- Keep the language non-alarming but honest.
- Format output into JSON with these keys:
  {
    "summary": "Short friendly summary of what's going on",
    "possible_causes": ["Cause 1", "Cause 2", "Cause 3"],
    "urgency": "low | medium | high",
    "next_steps": ["Step 1", "Step 2", "Step 3"]
  }
- Always include at least 1 emoji in the summary.
`;

// Enhanced CSRF protection middleware
function csrfProtection(req, res, next) {
    const token = req.get('X-CSRF-Token');
    if (!token) {
        return res.status(403).json({ error: 'CSRF token required' });
    }
    
    const origin = req.get('Origin');
    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
    
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Forbidden origin' });
    }
    
    next();
}

router.post("/analyze", csrfProtection, async (req, res) => {
    try {
        const { symptoms } = req.body;

        // Enhanced input validation
        if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === "") {
            return res.status(400).json({ error: "Please describe your symptoms" });
        }
        
        // Validate API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY not configured');
            return res.status(500).json({ error: "Service temporarily unavailable" });
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `User symptoms: ${encodeURIComponent(symptoms)}` }
                ],
                temperature: 0.8,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
                validateStatus: (status) => status < 500
            }
        );

        if (!response.data?.choices?.[0]?.message?.content) {
            console.error("Invalid API response structure:", response.data);
            return res.status(500).json({ error: "Invalid response from AI service" });
        }
        
        const aiContent = response.data.choices[0].message.content;

        let parsed;
        try {
            parsed = JSON.parse(aiContent);
        } catch (err) {
            console.error("Failed to parse AI response:", err);
            return res.status(500).json({ error: "Could not process AI output" });
        }

        res.json(parsed);

    } catch (error) {
        console.error("Error analyzing symptoms:", encodeURIComponent(error.message || ''));
        
        // Handle specific error types
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: "AI service temporarily unavailable" });
        }
        
        if (error.response?.status === 401) {
            return res.status(500).json({ error: "Authentication failed with AI service" });
        }
        
        if (error.response?.status === 429) {
            return res.status(429).json({ error: "Rate limit exceeded, please try again later" });
        }
        
        if (error.response?.status >= 400 && error.response?.status < 500) {
            return res.status(400).json({ error: "Invalid request to AI service" });
        }
        
        // Generic server error
        res.status(500).json({ error: "Analysis service temporarily unavailable" });
    }
});

module.exports = router;