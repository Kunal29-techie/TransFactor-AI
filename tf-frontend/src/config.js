// Configuration for TransFactor AI Frontend
// Automatically uses VITE_API_URL if set in production/deployment,
// otherwise defaults to local development backend.

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
