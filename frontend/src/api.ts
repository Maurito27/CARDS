const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Credenciales inválidas");
    return res.json() as Promise<{ token: string }>;
  },

  listCards: () => request<Card[]>("/cards"),
  getCard: (id: string) => request<CardDetail>(`/cards/${id}`),
  createCard: (data: { name: string; destination_url: string }) =>
    request<Card>("/cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCard: (
    id: string,
    data: Partial<{ name: string; destination_url: string; status: string }>
  ) =>
    request<Card>(`/cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export function getPublicBaseUrl(): string {
  return import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:3000";
}

export function getPermanentUrl(publicId: string): string {
  return `${getPublicBaseUrl()}/c/${publicId}`;
}

export interface Card {
  id: string;
  public_id: string;
  name: string;
  destination_url: string;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface DestinationHistoryEntry {
  id: string;
  previous_url: string | null;
  new_url: string;
  changed_at: string;
}

export interface CardDetail extends Card {
  history: DestinationHistoryEntry[];
  access_count: number;
}
