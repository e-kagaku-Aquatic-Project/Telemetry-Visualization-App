/**
 * Authentication utility functions
 */

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_TOKEN_NAME = 'auth_session_token'; // Name for the session cookie

/**
 * Helper to set a cookie
 */
const setCookie = (name: string, value: string, days: number): void => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * SESSION_DURATION_MS));
    expires = '; expires=' + date.toUTCString();
  }
  const cookieString = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  document.cookie = cookieString;
  console.log('setCookie: ', cookieString);
  console.log('document.cookie after set: ', document.cookie);
};

/**
 * Helper to get a cookie
 */
const getCookie = (name: string): string | null => {
  console.log('getCookie: current document.cookie: ', document.cookie);
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      console.log('getCookie: found cookie ', name, ': ', c.substring(nameEQ.length, c.length));
      return c.substring(nameEQ.length, c.length);
    }
  }
  console.log('getCookie: cookie ', name, ' not found.');
  return null;
};

/**
 * Helper to erase a cookie
 */
const eraseCookie = (name: string): void => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Simulate a backend login call.
 * In a real application, this would send credentials to a server and receive a token.
 * For this demo, we'll use a hardcoded password and generate a token.
 */
export const loginUser = async (password: string): Promise<boolean> => {
  // In a real app, this would be an API call to your backend
  // const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
  // const data = await response.json();
  // if (data.success) {
  //   setCookie(SESSION_TOKEN_NAME, data.token, 1); // Set cookie for 1 day
  //   return true;
  // }
  // return false;

  const appPassword = import.meta.env.VITE_APP_PASSWORD || 'ultrathink';

  if (password === appPassword) {
    const token = generateSessionToken(); // Simulate token generation
    console.log('loginUser: generated token:', token);
    setCookie(SESSION_TOKEN_NAME, token, 1); // Set cookie for 1 day
    return true;
  }
  return false;
};

/**
 * Simulate a backend session validation call.
 * In a real application, this would send the token to a server for validation.
 */
export const validateSession = async (): Promise<boolean> => {
  const token = getCookie(SESSION_TOKEN_NAME);
  if (!token) {
    console.log('validateSession: No token found in cookie. Returning false.');
    return false;
  }
  console.log('validateSession: Token found in cookie. Returning true.');
  // For demo, any token present is considered valid for SESSION_DURATION_MS
  return true;
};

/**
 * Generate a random session token (client-side for demo)
 */
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Clear session cookie
 */
export const clearSession = (): void => {
  eraseCookie(SESSION_TOKEN_NAME);
};

/**
 * Check current authentication status using session validation
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  return await validateSession();
};
