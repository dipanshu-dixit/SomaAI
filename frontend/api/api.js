// frontend/src/api/api.js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function analyze(symptoms) {
    const payload = { prompt: symptoms };
    const res = await axios.post(`${BASE}/api/analyze`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
    });
    return res.data;
}
