import axios from 'axios';

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
    
    throw error;
}

// Input validation helper
function validateSymptom(symptom) {
    if (!symptom?.trim()) {
        throw new Error('Please enter a symptom');
    }
}

export async function getQuestions(symptom) {
    try {
        validateSymptom(symptom);
        
        if (import.meta.env.DEV) {
            console.log('Fetching questions for symptom');
        }
        
        const response = await API.post('/api/generate-mcqs', { symptom: symptom.trim() });
        
        if (!response.data) {
            throw new Error('No response from server');
        }
        
        const questions = response.data.questions || [];
        return questions.length > 0 ? questions : DEFAULT_QUESTIONS;
        
    } catch (error) {
        try {
            handleApiError(error, 'fetching questions');
        } catch {
            // Return default questions as fallback for API errors
            return DEFAULT_QUESTIONS;
        }
    }
}

export async function analyze(symptom, answers) {
    try {
        validateSymptom(symptom);
        
        if (import.meta.env.DEV) {
            console.log('Analyzing symptom with answers');
        }
        
        const response = await API.post('/api/analyze', { 
            symptom: symptom.trim(), 
            answers: answers || {} 
        });
        
        if (!response.data?.result) {
            throw new Error('Invalid response from server');
        }
        
        return response.data.result;
        
    } catch (error) {
        handleApiError(error, 'analyzing symptoms');
        throw new Error(error.message || 'Failed to analyze symptoms. Please try again.');
    }
}
