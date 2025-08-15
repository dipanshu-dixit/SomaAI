// backend/routes/quickQuery.js
const express = require('express');
const { callOpenRouter } = require('../openrouterclient');
const router = express.Router();

const QUICK_QUERY_PROMPT = (question) => `
You are a friendly and knowledgeable health assistant. A user has a quick question. Provide a clear, concise, and helpful answer. Do not give medical advice, but you can provide general health information. Frame the answer in a supportive and easy-to-understand way.
Question: "${question}"
Answer:
`;

router.post('/', async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: 'Question is required.' });
    }

    try {
        const answer = await callOpenRouter(
            [{ role: 'system', content: QUICK_QUERY_PROMPT(question) }],
            { temperature: 0.5, max_tokens: 250 }
        );
        res.json({ answer });
    } catch (error) {
        console.error('Quick query error:', error);
        res.status(500).json({ error: 'Failed to get an answer from the AI service.' });
    }
});

module.exports = router;
