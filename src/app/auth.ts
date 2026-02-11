export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  mustChangePassword: boolean;
}

interface StoredSession {
  token: string;
  user: AppUser;
}

const SESSION_KEY = "gdi_leads_session";

export function getStoredSession(): { token: string; user: AppUser } | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as StoredSession;
    if (session.token && session.user) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: AppUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
