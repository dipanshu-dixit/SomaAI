// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getAIResponse } = require('./openrouterClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173'] })); // allow frontend dev
app.use(express.json());

app.get('/', (req, res) => res.send('SomaAI backend alive'));

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt, symptoms } = req.body;
        const userText = prompt ?? symptoms; // accept either field
        if (!userText || typeof userText !== 'string') {
            return res.status(400).json({ ok: false, error: 'prompt (string) or symptoms required' });
        }
        // call OpenRouter client
        const aiText = await getAIResponse(userText);
        return res.json({ ok: true, result: aiText });
    } catch (err) {
        console.error('/api/analyze error:', err.message || err);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ SomaAI backend running on http://localhost:${PORT}`);
});
