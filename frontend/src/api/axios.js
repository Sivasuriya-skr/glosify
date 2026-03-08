import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:8080", // ✅ CRA uses REACT_APP_
  headers: { "Content-Type": "application/json" },
});

// Add JWT token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bw_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem("bw_token");
      localStorage.removeItem("bw_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;