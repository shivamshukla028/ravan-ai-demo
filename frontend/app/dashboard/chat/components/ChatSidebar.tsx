"use client";

import { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Conversation } from "@/lib/api";

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Last 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updated_at || conv.created_at);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (day >= today) groups[0].items.push(conv);
    else if (day >= yesterday) groups[1].items.push(conv);
    else if (day >= lastWeek) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

interface Props {
  conversations: Conversation[];
  activeId: number | null;
  loading: boolean;
  searchQuery: string;
  onNew: () => void;
  onSelect: (id: number) => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onSearch: (q: string) => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  loading,
  searchQuery,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onSearch,
}: Props) {
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const groups = groupConversations(conversations);

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/[0.06]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <button
          id="new-chat-btn"
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-semibold text-sm transition-all shadow-[0_0_15px_rgba(14,165,233,0.1)] hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] group"
        >
          <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs text-white/80 placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/25 text-xs">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <p className="text-white/15 text-xs mt-1">Start a new chat above</p>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-4 py-1.5 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  className={`relative group mx-2 rounded-xl mb-0.5 transition-all ${
                    activeId === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {renamingId === conv.id ? (
                    /* Rename inline editor */
                    <div className="flex items-center gap-1 px-3 py-2">
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="flex-1 bg-white/10 border border-primary/30 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <button onClick={commitRename} className="p-1 hover:text-green-400 text-white/50 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setRenamingId(null)} className="p-1 hover:text-red-400 text-white/50 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : deleteConfirmId === conv.id ? (
                    /* Delete confirm */
                    <div className="px-3 py-2">
                      <p className="text-xs text-red-400 mb-2">Delete this chat?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onDelete(conv.id); setDeleteConfirmId(null); }}
                          className="flex-1 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/50 rounded-lg border border-white/10 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal item */
                    <button
                      onClick={() => onSelect(conv.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left"
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeId === conv.id ? "text-primary" : "text-white/25"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${activeId === conv.id ? "text-white" : "text-white/65"}`}>
                          {conv.title}
                        </p>
                        <p className="text-[10px] text-white/20 font-mono mt-0.5">
                          {conv.model?.split("-")[0] || "gpt"}
                        </p>
                      </div>
                      {activeId === conv.id && (
                        <ChevronRight className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                      )}
                    </button>
                  )}

                  {/* Action buttons (shown on hover, hidden during rename/delete confirm) */}
                  {renamingId !== conv.id && deleteConfirmId !== conv.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[#0a0a12] border border-white/10 rounded-lg px-1 py-1 shadow-xl">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(conv); }}
                        className="p-1.5 hover:text-white text-white/40 rounded-md hover:bg-white/10 transition-all"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(conv.id); }}
                        className="p-1.5 hover:text-red-400 text-white/40 rounded-md hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-white/[0.05]">
        <p className="text-[10px] text-white/20 font-mono">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
