"use client";

import { useState, useRef, useCallback } from "react";
import { Message, Conversation, streamChat, conversationsApi } from "@/lib/api";

export interface ChatMessage {
  id: string; // temp or real
  role: "user" | "assistant";
  content: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  isStreaming?: boolean;
}

export function useChat(
  onConversationCreated?: (conv: Conversation) => void,
  onConversationUpdated?: (data: { id: number; title: string; total_tokens_in: number; total_tokens_out: number }) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [totalTokensIn, setTotalTokensIn] = useState(0);
  const [totalTokensOut, setTotalTokensOut] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversation = useCallback(async (convId: number) => {
    try {
      const res = await conversationsApi.get(convId);
      const conv = res.data;
      setActiveConversationId(conv.id);
      setTotalTokensIn(conv.total_tokens_in || 0);
      setTotalTokensOut(conv.total_tokens_out || 0);
      setMessages(
        (conv.messages || []).map((m: Message) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          model: m.model,
          tokens_in: m.tokens_in,
          tokens_out: m.tokens_out,
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setTotalTokensIn(0);
    setTotalTokensOut(0);
  }, []);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (isStreaming || !content.trim()) return;

      // Add user message to UI immediately
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content },
      ]);

      // Add placeholder AI message with streaming cursor
      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", isStreaming: true },
      ]);

      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        await streamChat(
          {
            message: content,
            model,
            conversation_id: activeConversationId || undefined,
          },
          (event) => {
            if (event.type === "meta") {
              // New conversation was created on the server
              if (!activeConversationId) {
                setActiveConversationId(event.conversation_id);
                // Notify parent to add to sidebar
                onConversationCreated?.({
                  id: event.conversation_id,
                  title: event.title,
                  model,
                  user_id: 0,
                  total_tokens_in: 0,
                  total_tokens_out: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            } else if (event.type === "chunk") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              );
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        model,
                        tokens_out: event.tokens_out,
                      }
                    : m.id === userMsgId
                    ? { ...m, tokens_in: event.tokens_in }
                    : m
                )
              );
              setTotalTokensIn(event.total_tokens_in);
              setTotalTokensOut(event.total_tokens_out);
              // Update conversation token counts in sidebar
              if (activeConversationId) {
                onConversationUpdated?.({
                  id: activeConversationId,
                  title: "", // no title change
                  total_tokens_in: event.total_tokens_in,
                  total_tokens_out: event.total_tokens_out,
                });
              }
            }
          },
          abortRef.current.signal
        );
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `⚠️ **Error:** ${err.message || "Failed to connect to Ravan AI."}`,
                    isStreaming: false,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, activeConversationId, onConversationCreated, onConversationUpdated]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    activeConversationId,
    totalTokensIn,
    totalTokensOut,
    sendMessage,
    stopStreaming,
    loadConversation,
    clearMessages,
    setActiveConversationId,
  };
}
