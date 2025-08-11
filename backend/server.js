// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { analyzeWithOpenRouter } = require('./openrouterClient');
const cosmicMode = require('./middleware/cosmicMode');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

// apply cosmic middleware for analyze route
app.post('/api/analyze', cosmicMode, async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
            return res.status(400).json({ ok: false, error: "Field 'symptoms' is required." });
        }
        const result = await analyzeWithOpenRouter(symptoms.trim());
        res.json({ ok: true, result });
    } catch (err) {
        console.error('/api/analyze error:', err.message || err);
        res.status(500).json({ ok: false, error: 'Failed to analyze symptoms' });
    }
});

app.get('/', (req, res) => res.send('SomaAI backend alive'));

app.listen(PORT, () => {
    console.log(`✅ SomaAI backend running at http://localhost:${PORT}`);
});
