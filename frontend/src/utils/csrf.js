// CSRF token management
let csrfToken = null;

export async function getCsrfToken() {
    if (csrfToken) return csrfToken;
    
    try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', encodeURIComponent(error.message || ''));
        return null;
    }
}

export function clearCsrfToken() {
    csrfToken = null;
}