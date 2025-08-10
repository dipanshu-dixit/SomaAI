// frontend/src/api/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function analyze(symptoms) {
    const res = await axios.post(`${API_BASE}/analyze`, { symptoms });
    return res.data; // { ok: true, result: { summary, possible_causes, urgency, next_steps } }
}