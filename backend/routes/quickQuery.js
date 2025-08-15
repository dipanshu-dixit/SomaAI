const express = require('express');
const { generateQuickAnswer } = require('../aiFlow');

const router = express.Router();

router.post('/', async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === "") {
        return res.status(400).json({ error: 'A non-empty question is required.' });
    }

    try {
        const answer = await generateQuickAnswer(question);
        res.json({ answer });
    } catch (error) {
        console.error('Error in /api/quick-query:', error);
        res.status(500).json({
            error: 'Failed to generate an answer.',
            details: error.message
        });
    }
});

module.exports = router;
