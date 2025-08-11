import axios from 'axios';
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export async function analyze(symptoms) {
    const res = await axios.post(`${BASE}/api/analyze`, { symptoms }, { timeout: 30000 });
    return res.data;
}
