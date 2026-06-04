import axios from "axios";

const isDevelopment = process.env.NODE_ENV === "development";

let devBaseUrl = "http://localhost:5000/api";
if (typeof window !== "undefined") {
  devBaseUrl = `http://${window.location.hostname}:5000/api`;
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || (isDevelopment ? devBaseUrl : "/api");

const api = axios.create({
  // Dynamically uses the host IP instead of strict localhost to support testing on phones/LAN
  baseURL,
  withCredentials: true
});

let csrfTokenPromise = null;

function getCsrfToken() {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (!csrfTokenPromise) {
    csrfTokenPromise = axios.get(`${baseURL}/csrf-token`, { withCredentials: true })
      .then((res) => res.data.csrfToken)
      .catch((err) => {
        csrfTokenPromise = null; // Reset to retry on next request
        throw err;
      });
  }
  return csrfTokenPromise;
}

api.interceptors.request.use(
  async (config) => {
    const method = config.method ? config.method.toLowerCase() : "";
    // Only fetch/attach CSRF token for state-changing HTTP requests
    if (["post", "put", "patch", "delete"].includes(method)) {
      try {
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
          config.headers.set("X-CSRF-Token", csrfToken);
        }
      } catch (_err) {
        // Fail silently without exposing details in client console logs
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expose correlation ID from backend to the client error object for UI tracing
    if (error.response?.data?.correlationId) {
      error.correlationId = error.response.data.correlationId;
    }

    // If we receive a 403 Forbidden with a message indicating invalid CSRF token, reset cache so we refetch
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.message?.toLowerCase().includes("csrf")
    ) {
      csrfTokenPromise = null;
    }
    return Promise.reject(error);
  }
);

export default api;
