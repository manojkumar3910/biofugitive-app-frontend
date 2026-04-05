import { Platform } from 'react-native';

// API Configuration
const LOCAL_IP = "10.205.212.135"; // Your local network IP
const NGROK_URL = "https://euphoric-nyla-diplomatic.ngrok-free.dev"; // PASTE YOUR NGROK URL HERE (e.g., "https://1234.ngrok.app")

export const API_BASE_URL = NGROK_URL || Platform.select({
  web: "http://localhost:5000",
  android: `http://${LOCAL_IP}:5000`,
  ios: `http://${LOCAL_IP}:5000`,
  default: "http://localhost:5000",
});

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/login`,
  SIGNUP: `${API_BASE_URL}/signup`,
  ME: `${API_BASE_URL}/me`,

  // Users (Admin only)
  USERS: `${API_BASE_URL}/users`,

  // Documents & Persons
  DOCUMENTS: `${API_BASE_URL}/documents`,
  PERSONS: `${API_BASE_URL}/persons`,
  PERSONS_DB: `${API_BASE_URL}/persons-db`,

  // Fingerprints
  FINGERPRINTS: `${API_BASE_URL}/fingerprints`,
  FINGERPRINT_MATCH: `${API_BASE_URL}/fingerprint-match`,

  // Cases
  CASES: `${API_BASE_URL}/cases`,
  CASES_STATS: `${API_BASE_URL}/cases-stats`,

  // Stats & Analytics
  STATS: `${API_BASE_URL}/stats`,
  ANALYTICS: `${API_BASE_URL}/analytics`,
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard-stats`,

  // Reports
  REPORTS: `${API_BASE_URL}/reports`,
  REPORTS_GENERATE: `${API_BASE_URL}/reports/generate`,

  // Audit Logs
  AUDIT_LOGS: `${API_BASE_URL}/audit-logs`,

  // Watchlist
  WATCHLIST: `${API_BASE_URL}/watchlist`,

  // Export
  EXPORT_CSV: `${API_BASE_URL}/export/csv`,
};

// Helper to create authenticated request headers
export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

// Helper for authenticated API calls
export const authFetch = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  });

  // Handle unauthorized errors
  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (response.status === 403) {
    throw new Error('FORBIDDEN');
  }

  return response;
};
