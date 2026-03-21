const USER_KEY = "ccrp_user";

export function setAuth(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function logout() {
  if (typeof window === "undefined") return;
  try {
    const api = (await import("./api")).default;
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout failed", err);
  }
  localStorage.removeItem(USER_KEY);
}
