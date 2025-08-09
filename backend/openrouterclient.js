// backend/openrouterClient.js
import 'dotenv/config';
import axios from 'axios';

export const getAIResponse = async (userPrompt) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mixtral-8x7b',  // You can also try: openai/gpt-3.5-turbo
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173/',  // Or your frontend URL
          'X-Title': 'Symptom.ai',
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('OpenRouter API Error:', err.message);
    throw err;
  }
};