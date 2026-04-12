import axios from "axios";

const api = axios.create({
  // Default to same-origin API behind reverse proxy (e.g., Nginx on port 80).
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  withCredentials: true
});

export default api;
