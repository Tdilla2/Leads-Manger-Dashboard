const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  const session = localStorage.getItem('gdi_leads_session');
  if (!session) return null;
  try {
    return JSON.parse(session).token;
  } catch {
    return null;
  }
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid — clear session
    localStorage.removeItem('gdi_leads_session');
    window.location.reload();
    throw new Error('Session expired');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// ---- Auth ----

export async function apiLogin(username: string, password: string) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function apiChangePassword(newPassword: string) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

// ---- Users ----

export async function apiGetUsers() {
  return apiRequest('/api/users');
}

export async function apiCreateUser(username: string, displayName: string, role: 'admin' | 'user') {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username, displayName, role }),
  });
}

export async function apiUpdateUser(id: string, displayName: string, username: string, role: 'admin' | 'user') {
  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ displayName, username, role }),
  });
}

export async function apiDeleteUser(id: string) {
  return apiRequest(`/api/users/${id}`, { method: 'DELETE' });
}

export async function apiResetPassword(id: string) {
  return apiRequest(`/api/users/${id}/reset-password`, { method: 'POST' });
}

// ---- Leads ----

export async function apiGetLeads(filters?: {
  status?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  archived?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
    });
  }
  const qs = params.toString();
  return apiRequest(`/api/leads${qs ? `?${qs}` : ''}`);
}

export async function apiGetLead(id: string) {
  return apiRequest(`/api/leads/${id}`);
}

export async function apiCreateLead(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  value?: number;
  source: string;
  assignedTo?: string;
}) {
  return apiRequest('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateLead(id: string, data: Record<string, any>) {
  return apiRequest(`/api/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiArchiveLead(id: string) {
  return apiRequest(`/api/leads/${id}/archive`, { method: 'PATCH' });
}

export async function apiAddNote(leadId: string, text: string) {
  return apiRequest(`/api/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function apiAddTask(leadId: string, title: string, dueDate: string) {
  return apiRequest(`/api/leads/${leadId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ title, dueDate }),
  });
}

export async function apiToggleTask(leadId: string, taskId: string) {
  return apiRequest(`/api/leads/${leadId}/tasks/${taskId}`, { method: 'PATCH' });
}

export async function apiAddActivity(leadId: string, type: string, description: string) {
  return apiRequest(`/api/leads/${leadId}/activities`, {
    method: 'POST',
    body: JSON.stringify({ type, description }),
  });
}
