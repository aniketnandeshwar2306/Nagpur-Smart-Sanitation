/**
 * Centralized API base URL configuration for Nagpur Smart Sanitation.
 * Automatically resolves between Render backend URL, local dev server, and custom URL override.
 */

const getApiBaseUrl = (): string => {
  // 1. Runtime override from localStorage (helpful for testing custom Render deployment URLs)
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('nss_api_url');
    if (savedUrl) return savedUrl.replace(/\/$/, '');
  }

  // 2. Vite Environment Variable configured on Vercel
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 3. Local development server fallback
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000';
  }

  // 4. Default fallback in production if not set
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

if (typeof window !== 'undefined') {
  console.log(
    '%c[NSS Backend Connection]',
    'color: #10b981; font-weight: bold;',
    `API_BASE_URL is set to: "${API_BASE_URL || '(relative / same domain)'}"`
  );
}
