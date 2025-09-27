import axios from "axios";

// Prefer explicit env var; in dev use a relative `/api` so Vite can proxy requests
// to the backend. In production (or when VITE_API_BASE_URL is provided) use the
// explicit host.
const defaultHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
let baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) {
  if (import.meta.env.DEV) {
    // During development, leave baseURL empty so API modules that call
    // absolute paths like `/api/orders` hit the current origin and Vite's
    // dev server proxy (`/api` -> backend) will forward them correctly.
    baseURL = '';
  } else {
    baseURL = `http://${defaultHost}:3000`;
  }
}

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
    const silent = error?.config?.silent === true || error?.config?.headers?.silent === true;
    if (error.response) {
      // Suppress noisy 404 logs for endpoints that legitimately return 404 when no data exists.
      // Allow callers to opt-out of console logging by passing `{ silent: true }` in the request config.
      if (!silent && error.response.status !== 404) {
        console.error("API Error:", error.response.status, error.response.data);
      }
    } else if (error.request) {
      if (!silent) console.error("API Error: No response from server", error.request);
    } else {
      if (!silent) console.error("API Error: Request setup failed", error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
