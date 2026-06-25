/**
 * Typed API client for Ravan AI backend
 * Automatically injects JWT token from localStorage
 */
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  // Inject auth token on every request
  client.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Global error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createApiClient();

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  model: string;
  total_tokens_in: number;
  total_tokens_out: number;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ModelInfo {
  id: string;
  label: string;
  tags: string[];
  provider: string;
}

export interface ModelGroup {
  group: string;
  models: ModelInfo[];
}

// ─── Conversation API ─────────────────────────────────────────────────────────

export const conversationsApi = {
  list: (search?: string) =>
    api.get<Conversation[]>("/api/chat/conversations", {
      params: search ? { search } : undefined,
    }),

  create: (title?: string, model?: string) =>
    api.post<Conversation>("/api/chat/conversations", { title, model }),

  get: (id: number) =>
    api.get<Conversation>(`/api/chat/conversations/${id}`),

  update: (id: number, data: { title?: string; model?: string }) =>
    api.patch<Conversation>(`/api/chat/conversations/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/chat/conversations/${id}`),

  exportUrl: (id: number, fmt: "json" | "markdown" = "json") =>
    `${BASE_URL}/api/chat/conversations/${id}/export?fmt=${fmt}`,
};

export const modelsApi = {
  list: () => api.get<{ models: ModelGroup[] }>("/api/chat/models"),
};

// ─── SSE Streaming ────────────────────────────────────────────────────────────

export interface StreamMeta {
  type: "meta";
  conversation_id: number;
  title: string;
}

export interface StreamChunk {
  type: "chunk";
  content: string;
}

export interface StreamDone {
  type: "done";
  tokens_in: number;
  tokens_out: number;
  total_tokens_in: number;
  total_tokens_out: number;
}

export type StreamEvent = StreamMeta | StreamChunk | StreamDone;

export async function streamChat(
  params: {
    message: string;
    model: string;
    conversation_id?: number;
    system_prompt?: string;
  },
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event: StreamEvent = JSON.parse(raw);
          onEvent(event);
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }
}
