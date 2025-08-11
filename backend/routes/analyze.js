import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/analyze", async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || symptoms.trim() === "") {
            return res.status(400).json({ error: "Please describe your symptoms" });
        }

        // SYSTEM PROMPT — sets the tone & cosmic mode integration
        const systemPrompt = `
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

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `User symptoms: ${symptoms}` }
                ],
                temperature: 0.8,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const aiContent = response.data.choices[0]?.message?.content;

        let parsed;
        try {
            parsed = JSON.parse(aiContent);
        } catch (err) {
            console.error("Failed to parse AI response:", err);
            return res.status(500).json({ error: "Could not process AI output" });
        }

        res.json(parsed);

    } catch (error) {
        console.error("Error analyzing symptoms:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;
