// src/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // supaya cookie ikut terkirim
});

// Response interceptor untuk refresh token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Jika bukan 401, return error
    if (err.response?.status !== 401) {
      return Promise.reject(err);
    }

    // Jangan refresh kalau endpoint refresh-token atau login-otp
    if (
      originalRequest.url.includes("/refresh-token") ||
      originalRequest.url.includes("/login-otp")
    ) {
      return Promise.reject(err);
    }

    // 🚨 Prevent retry loop
    if (originalRequest._retry) {
      return Promise.reject(err);
    }
    originalRequest._retry = true;

    try {
      // request refresh token
      await api.post("/refresh-token");

      // ulang request sebelumnya
      return api(originalRequest);
    } catch (refreshErr) {
      // redirect ke login kalau refresh token invalid / expired
      return Promise.reject(refreshErr);
    }
  }
);

export default api;
