"use client";

import { useState, useCallback } from "react";
import { conversationsApi, Conversation } from "@/lib/api";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const res = await conversationsApi.list(search);
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(
    async (title?: string, model?: string): Promise<Conversation | null> => {
      try {
        const res = await conversationsApi.create(title, model);
        setConversations((prev) => [res.data, ...prev]);
        return res.data;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    },
    []
  );

  const renameConversation = useCallback(
    async (id: number, title: string): Promise<void> => {
      try {
        const res = await conversationsApi.update(id, { title });
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? res.data : c))
        );
      } catch (err) {
        console.error("Failed to rename conversation:", err);
      }
    },
    []
  );

  const deleteConversation = useCallback(async (id: number): Promise<void> => {
    try {
      await conversationsApi.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, []);

  const updateConversationInList = useCallback(
    (updated: Partial<Conversation> & { id: number }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === updated.id ? { ...c, ...updated } : c
        )
      );
    },
    []
  );

  const addConversationToList = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conv.id);
      if (exists) return prev;
      return [conv, ...prev];
    });
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchConversations(query || undefined);
    },
    [fetchConversations]
  );

  return {
    conversations,
    loading,
    searchQuery,
    fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    updateConversationInList,
    addConversationToList,
    handleSearch,
  };
}
