import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://192.168.69.104:3000";

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
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("API Error: No response from server", error.request);
    } else {
      console.error("API Error: Request setup failed", error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
