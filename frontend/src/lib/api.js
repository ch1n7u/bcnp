import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://43.204.73.62:5000/api",
  withCredentials: true
});

export default api;
