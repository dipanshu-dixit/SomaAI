import axios from 'axios';
import { getCsrfToken } from '../utils/csrf';

// Configuration constants
const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    TIMEOUT: 30000,
    HEADERS: { 'Content-Type': 'application/json' }
};

const DEFAULT_QUESTIONS = [
    { id: 'onset', q: 'When did this start?', options: ['Today', 'This week', 'Longer ago'] },
    { id: 'severity', q: 'How severe is it?', options: ['Mild', 'Moderate', 'Severe'] },
    { id: 'other', q: 'Any other symptoms?', options: ['Yes', 'No'] }
];

const API = axios.create({ 
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

// Add CSRF token to requests
API.interceptors.request.use(async (config) => {
    if (config.method !== 'get') {
        const token = await getCsrfToken();
        if (token) {
            config.headers['X-CSRF-Token'] = token;
        }
    }
    return config;
});

// Reusable error handling function
function handleApiError(error, operation) {
    console.error(`Error ${operation}:`, error);
    
    if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment.');
    }
    if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again.');
    }
    
    throw new Error('An unexpected error occurred. Please try again.');
}

// Input validation helper
function validateSymptom(symptom) {
    if (!symptom?.trim()) {
        throw new Error('Please enter a symptom');
    }
}

export async function getQuestions(symptom, type = 'physical') {
    try {
        validateSymptom(symptom);
        
        if (import.meta.env.DEV) {
            console.log(`Fetching questions for symptom: ${encodeURIComponent(symptom)}, type: ${type}`);
        }
        
        const response = await API.post('/api/generate-mcqs', { symptom: symptom.trim(), type });
        
        if (!response.data) {
            throw new Error('No response from server');
        }
        
        const questions = response.data.questions || [];
        return questions.length > 0 ? questions : DEFAULT_QUESTIONS;
        
    } catch (error) {
        console.warn('API error, using fallback questions:', error.message);
        // Return default questions as fallback for API errors
        return DEFAULT_QUESTIONS;
    }
}

export async function analyze(symptom, answers, type = 'physical') {
    try {
        validateSymptom(symptom);
        
        if (import.meta.env.DEV) {
            console.log(`Analyzing symptom with answers: ${encodeURIComponent(symptom)}, type: ${type}`);
        }
        
        const response = await API.post('/api/analyze', { 
            symptom: symptom.trim(), 
            answers: answers || {},
            type
        });
        
        if (!response.data?.result) {
            throw new Error('Invalid response from server');
        }
        
        return response.data.result;
        
    } catch (error) {
        handleApiError(error, 'analyzing symptoms');
    }
}

export async function quickQuery(question) {
    if (!question?.trim()) {
        throw new Error('Please enter a question');
    }

    try {
        const response = await API.post('/api/quick-query', { question: question.trim() });
        if (!response.data?.answer) {
            throw new Error('Invalid answer format from server.');
        }
        return response.data.answer;
    } catch (error) {
        handleApiError(error, 'processing quick query');
    }
}

export async function getCosmicInsight(context) {
    if (!context || !context.symptom || !context.summary) {
        throw new Error('Valid context is required.');
    }

    try {
        const response = await API.post('/api/cosmic-insight', { context });
        if (!response.data?.insight) {
            throw new Error('Invalid insight format from server.');
        }
        return response.data.insight;
    } catch (error) {
        handleApiError(error, 'getting cosmic insight');
    }
}