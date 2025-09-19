import axios from "axios";

// Prefer explicit env var; fall back to the current host on port 3000 (useful for dev setups)
const defaultHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
const baseURL = import.meta.env.VITE_API_BASE_URL || `http://${defaultHost}:3000`;

const client = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Suppress noisy 404 logs for endpoints that legitimately return 404 when no data exists.
      // Let callers decide how to handle a 404 (for example, showing 0 instead of an error).
      if (error.response.status !== 404) {
        console.error("API Error:", error.response.status, error.response.data);
      }
    } else if (error.request) {
      console.error("API Error: No response from server", error.request);
    } else {
      console.error("API Error: Request setup failed", error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
