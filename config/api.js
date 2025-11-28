// API Configuration
// Change this URL based on your environment

// For local development (use your computer's IP for mobile testing):
export const API_BASE_URL = "https://euphoric-nyla-diplomatic.ngrok-free.dev";

// For localhost (only works in web/emulator on same machine):
// export const API_BASE_URL = "http://localhost:5000";

// For production (Render deployment):
// export const API_BASE_URL = "https://biofugitive-backend.onrender.com";

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  SIGNUP: `${API_BASE_URL}/signup`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  PERSONS: `${API_BASE_URL}/persons`,
  FINGERPRINTS: `${API_BASE_URL}/fingerprints`,
  STATS: `${API_BASE_URL}/stats`,
};
