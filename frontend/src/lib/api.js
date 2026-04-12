import axios from "axios";

const isDevelopment = process.env.NODE_ENV === "development";

let devBaseUrl = "http://localhost:5000/api";
if (typeof window !== "undefined") {
  devBaseUrl = `http://${window.location.hostname}:5000/api`;
}

const api = axios.create({
  // Dynamically uses the host IP instead of strict localhost to support testing on phones/LAN
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || (isDevelopment ? devBaseUrl : "/api"),
  withCredentials: true
});

export default api;
