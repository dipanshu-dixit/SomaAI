// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getAIResponse } = require('./openrouterClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // allow local dev talk
app.use(express.json());

app.get('/', (req, res) => {
    res.send('SomaAI backend alive');
});

/**
 * POST /api/analyze
 * Body: { prompt: "user text" }
 * Response: { ok: true, result: "AI text..." } or { ok:false, error: "..." }
 */
app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ ok: false, error: 'prompt (string) is required in JSON body' });
        }

        // call the OpenRouter client
        const aiText = await getAIResponse(prompt.trim());

        return res.json({ ok: true, result: aiText });
    } catch (err) {
        console.error('Server /api/analyze error:', err.message || err);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ SomaAI backend running on http://localhost:${PORT}`);
});
