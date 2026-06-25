"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

const BASE = "/api/knowledge";

export interface KBDocument {
  id: number;
  user_id: number;
  filename: string;
  original_filename?: string;
  file_size?: number;
  page_count?: number;
  chunk_count?: number;
  description?: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  status: "processing" | "ready" | "failed";
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface KBCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface KBStats {
  total_documents: number;
  total_size_bytes: number;
  total_chunks: number;
  ready_documents: number;
  processing_documents: number;
  failed_documents: number;
  categories_count: number;
}

export interface SearchResult {
  document_id: number;
  filename: string;
  chunk_content: string;
  page_number?: number;
  relevance_score: number;
  chunk_index: number;
}

export function useKnowledge() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [stats, setStats] = useState<KBStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchDocuments = useCallback(
    async (params?: { search?: string; category_id?: number; status?: string }) => {
      setLoading(true);
      try {
        const res = await api.get(`${BASE}/documents`, { params });
        setDocuments(res.data.documents || []);
        return res.data;
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get(`${BASE}/categories`);
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get(`${BASE}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const uploadDocument = useCallback(
    async (
      file: File,
      categoryId?: number,
      description?: string,
      onProgress?: (pct: number) => void
    ): Promise<KBDocument | null> => {
      const formData = new FormData();
      formData.append("file", file);
      if (categoryId) formData.append("category_id", String(categoryId));
      if (description) formData.append("description", description);

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || ""
            : "";

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/knowledge/upload`
        );
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        return await new Promise((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress?.(pct);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              // Add optimistic document to list
              const optimistic: KBDocument = {
                id: data.id,
                user_id: 0,
                filename: data.filename,
                file_size: data.file_size,
                status: "processing",
                created_at: new Date().toISOString(),
              };
              setDocuments((prev) => [optimistic, ...prev]);
              resolve(optimistic);
            } else {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || "Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      } catch (err) {
        console.error("Upload failed:", err);
        throw err;
      }
    },
    []
  );

  const deleteDocument = useCallback(async (id: number): Promise<void> => {
    try {
      await api.delete(`${BASE}/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      throw err;
    }
  }, []);

  const pollDocumentStatus = useCallback(
    async (docId: number, onUpdate: (doc: Partial<KBDocument>) => void) => {
      const poll = async () => {
        try {
          const res = await api.get(`${BASE}/documents/${docId}/status`);
          const data = res.data;
          onUpdate(data);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    status: data.status,
                    chunk_count: data.chunk_count,
                    page_count: data.page_count,
                    error_message: data.error_message,
                  }
                : d
            )
          );
          if (data.status === "processing") {
            setTimeout(poll, 2000);
          } else {
            // Refresh stats when done
            fetchStats();
          }
        } catch {}
      };
      setTimeout(poll, 2000);
    },
    [fetchStats]
  );

  const createCategory = useCallback(
    async (name: string, color: string, icon: string): Promise<KBCategory | null> => {
      try {
        const res = await api.post(`${BASE}/categories`, { name, color, icon });
        setCategories((prev) => [...prev, res.data]);
        return res.data;
      } catch (err) {
        console.error("Create category failed:", err);
        return null;
      }
    },
    []
  );

  const semanticSearch = useCallback(
    async (query: string, documentIds?: number[]): Promise<void> => {
      if (!query.trim()) return;
      setSearching(true);
      try {
        const res = await api.post(`${BASE}/search`, {
          query,
          limit: 8,
          document_ids: documentIds,
        });
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  return {
    documents,
    categories,
    stats,
    loading,
    searchResults,
    searching,
    fetchDocuments,
    fetchCategories,
    fetchStats,
    uploadDocument,
    deleteDocument,
    pollDocumentStatus,
    createCategory,
    semanticSearch,
    setDocuments,
  };
}
