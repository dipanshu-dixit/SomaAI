// backend/openrouterClient.js
import axios from "axios";

export async function analyzeSymptoms(symptoms) {
  const prompt = `
You are a medical information assistant. 
Analyze the given symptoms and respond ONLY in the following JSON format (no extra text outside JSON):

{
  "summary": "short plain-language summary (2-3 sentences)",
  "possible_causes": ["condition1", "condition2", "..."],
  "urgency": "low" | "medium" | "high",
  "next_steps": ["step1", "step2", "..."]
}

Use cautious, non-diagnostic language. Do not make absolute claims. Always recommend professional evaluation.
  
Symptoms: ${symptoms}
  `;

  const res = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openai/gpt-4o-mini", // or whatever model you're using
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let parsed;
  try {
    parsed = JSON.parse(res.data.choices[0].message.content);
  } catch (e) {
    throw new Error("Invalid JSON from AI");
  }

  return parsed;
}