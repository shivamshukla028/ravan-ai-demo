"use client";

import { useEffect, useState, useCallback } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatWindow } from "./components/ChatWindow";
import { useConversations } from "./hooks/useConversations";
import { useChat } from "./hooks/useChat";
import { Conversation } from "@/lib/api";

const DEFAULT_MODEL = "gpt-4o";

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

  const {
    conversations,
    loading: convsLoading,
    searchQuery,
    fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    updateConversationInList,
    addConversationToList,
    handleSearch,
  } = useConversations();

  // Called when the AI router auto-creates a new conversation (first message)
  const handleConversationCreated = useCallback(
    (conv: Conversation) => {
      addConversationToList(conv);
    },
    [addConversationToList]
  );

  // Called when token counts update after each response
  const handleConversationUpdated = useCallback(
    (data: {
      id: number;
      title: string;
      total_tokens_in: number;
      total_tokens_out: number;
    }) => {
      updateConversationInList(data);
    },
    [updateConversationInList]
  );

  const {
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
  } = useChat(handleConversationCreated, handleConversationUpdated);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    setActiveConversationId(null);
    setSelectedModel(DEFAULT_MODEL);
  }, [clearMessages, setActiveConversationId]);

  const handleSelectConversation = useCallback(
    (id: number) => {
      loadConversation(id);
      // Set model from conversation's model field
      const conv = conversations.find((c) => c.id === id);
      if (conv?.model) setSelectedModel(conv.model);
    },
    [loadConversation, conversations]
  );

  const handleDeleteConversation = useCallback(
    async (id: number) => {
      await deleteConversation(id);
      if (activeConversationId === id) {
        clearMessages();
        setActiveConversationId(null);
      }
    },
    [deleteConversation, activeConversationId, clearMessages, setActiveConversationId]
  );

  return (
    <>
      {/* Conversation Sidebar */}
      <div className="w-72 flex-shrink-0 h-full">
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          loading={convsLoading}
          searchQuery={searchQuery}
          onNew={handleNewChat}
          onSelect={handleSelectConversation}
          onRename={renameConversation}
          onDelete={handleDeleteConversation}
          onSearch={handleSearch}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full overflow-hidden">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          model={selectedModel}
          totalTokensIn={totalTokensIn}
          totalTokensOut={totalTokensOut}
          activeConversationId={activeConversationId}
          onSend={sendMessage}
          onStop={stopStreaming}
          onModelChange={setSelectedModel}
        />
      </div>
    </>
  );
}

