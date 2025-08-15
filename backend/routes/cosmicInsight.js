// backend/routes/cosmicInsight.js
const express = require('express');
const { callOpenRouter } = require('../openrouterclient');
const router = express.Router();

const COSMIC_INSIGHT_PROMPT = (context) => `
You are a wise, modern philosopher with a touch of cosmic wonder. You are not a doctor. A user has received a brief health summary and is asking for a deeper, more reflective insight. Based on their situation, provide a short, comforting, and thought-provoking reflection (2-3 sentences). Connect their personal feeling to a larger, universal idea (e.g., the body's wisdom, the nature of healing, the mind-body connection, a metaphor from nature or space).

User's situation:
Symptom: "${context.symptom}"
Initial Summary: "${context.summary}"

Your reflective insight:
`;

router.post('/', async (req, res) => {
    const { context } = req.body;

    if (!context || !context.symptom || !context.summary) {
        return res.status(400).json({ error: 'Context with symptom and summary is required.' });
    }

    try {
        const insight = await callOpenRouter(
            [{ role: 'system', content: COSMIC_INSIGHT_PROMPT(context) }],
            { temperature: 0.8, max_tokens: 150 }
        );
        res.json({ insight });
    } catch (error) {
        console.error('Cosmic insight error:', error);
        res.status(500).json({ error: 'Failed to get a cosmic insight from the AI service.' });
    }
});

module.exports = router;
