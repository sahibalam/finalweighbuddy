// API Configuration utility
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : '/api';
export const UPLOADS_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : '';

// Helper function to get uploads URL
export const getUploadsUrl = (path) => {
  return `${UPLOADS_BASE_URL}/uploads/${path}`;
};

// Helper function to get API URL
export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
