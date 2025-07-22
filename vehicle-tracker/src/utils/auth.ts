/**
 * Authentication utility functions
 */

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_TOKEN_KEY = 'auth_session_token';
const SESSION_TIMESTAMP_KEY = 'auth_session_timestamp';

/**
 * Simple hash function for password (for demo purposes only)
 * In production, use proper hashing like bcrypt
 */
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Verify password against environment variable
 */
export const verifyPassword = (inputPassword: string): boolean => {
  const appPassword = import.meta.env.VITE_APP_PASSWORD || 'ultrathink'; // Fallback for development
  if (!import.meta.env.VITE_APP_PASSWORD) {
    console.warn('VITE_APP_PASSWORD not set in environment variables, using default');
    console.log('Available env vars:', Object.keys(import.meta.env));
  }
  return inputPassword === appPassword;
};

/**
 * Generate a random session token
 */
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if session is valid
 */
export const isSessionValid = (token: string | null, timestamp: number | null): boolean => {
  if (!token || !timestamp) {
    return false;
  }
  
  const currentTime = Date.now();
  const sessionAge = currentTime - timestamp;
  
  return sessionAge < SESSION_DURATION;
};

/**
 * Save session to localStorage
 */
export const saveSession = (token: string): void => {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
};

/**
 * Get session from localStorage
 */
export const getSession = (): { token: string | null; timestamp: number | null } => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : null;
  
  return { token, timestamp };
};

/**
 * Clear session from localStorage
 */
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
};

/**
 * Check current authentication status
 */
export const checkAuthStatus = (): boolean => {
  const { token, timestamp } = getSession();
  return isSessionValid(token, timestamp);
};