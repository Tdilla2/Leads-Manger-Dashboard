export interface AppUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: "admin" | "user";
  mustChangePassword: boolean;
  createdAt: string;
}

const USERS_KEY = "gdi_leads_users";
const SESSION_KEY = "gdi_leads_session";

const defaultAdmin: AppUser = {
  id: "1",
  username: "admin",
  password: "Password123!",
  displayName: "Administrator",
  role: "admin",
  mustChangePassword: false,
  createdAt: new Date().toISOString(),
};

export function getUsers(): AppUser[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  }
  return JSON.parse(stored);
}

export function saveUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function authenticate(username: string, password: string): AppUser | null {
  const users = getUsers();
  return users.find(u => u.username === username && u.password === password) || null;
}

export function getSession(): AppUser | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  const session = JSON.parse(stored) as AppUser;
  // Verify user still exists
  const users = getUsers();
  return users.find(u => u.id === session.id) || null;
}

export function setSession(user: AppUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function createUser(
  username: string,
  displayName: string,
  role: "admin" | "user" = "user"
): AppUser {
  const users = getUsers();
  const newUser: AppUser = {
    id: Date.now().toString(),
    username,
    password: "password123",
    displayName,
    role,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUserPassword(userId: string, newPassword: string): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].password = newPassword;
    users[idx].mustChangePassword = false;
    saveUsers(users);
    setSession(users[idx]);
  }
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}

export function resetUserPassword(userId: string): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].password = "password123";
    users[idx].mustChangePassword = true;
    saveUsers(users);
  }
}

export function updateUser(
  userId: string,
  displayName: string,
  username: string,
  role: "admin" | "user"
): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].displayName = displayName;
    users[idx].username = username;
    users[idx].role = role;
    saveUsers(users);
  }
}
