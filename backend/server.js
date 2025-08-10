// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeSymptoms } from "./openrouterClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
        return res.status(400).json({ ok: false, error: "Missing or invalid 'symptoms' field" });
    }

    try {
        const result = await analyzeSymptoms(symptoms);
        res.json({ ok: true, result });
    } catch (err) {
        console.error("Analysis error:", err.message);
        res.status(500).json({ ok: false, error: "Failed to analyze symptoms" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));