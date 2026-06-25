"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  StopCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  BookOpen,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { KBDocument } from "../hooks/useKnowledge";

interface Citation {
  ref: number;
  filename: string;
  page_number?: number;
  chunk_content: string;
  relevance_score: number;
  document_id: number;
}

interface RAGMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

const FOLLOW_UPS = [
  "What are the key risks mentioned?",
  "Summarize the compliance requirements",
  "What actions are recommended?",
  "List all important dates or deadlines",
];

interface Props {
  documents: KBDocument[];
  initialQuestion?: string;
  onClose?: () => void;
}

export function RAGChat({ documents, initialQuestion, onClose }: Props) {
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [input, setInput] = useState(initialQuestion || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const readyDocs = documents.filter((d) => d.status === "ready");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim() || isStreaming) return;

    const userMsg: RAGMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    const assistantMsg: RAGMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/knowledge/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            model: "gpt-4o",
            document_ids: selectedDocIds.length ? selectedDocIds : undefined,
            max_context_chunks: 5,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to RAG endpoint");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let citations: Citation[] = [];

      const updateAssistant = (update: Partial<RAGMessage>) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, ...update } : m
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === "citations") {
              citations = event.citations;
              updateAssistant({ citations });
            } else if (event.type === "chunk") {
              updateAssistant({
                content: (assistantMsg.content += event.content),
              });
              // Refresh from state
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              );
            } else if (event.type === "error") {
              updateAssistant({
                content: `⚠️ ${event.content}`,
                isStreaming: false,
              });
            }
          } catch {}
        }
      }

      updateAssistant({ isStreaming: false, citations });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "⚠️ Connection error. Is the backend running?", isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, selectedDocIds]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => ({ ...m, isStreaming: false }))
    );
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] rounded-2xl border border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Knowledge Q&A</h3>
            <p className="text-[10px] text-white/30 font-mono">RAG · Retrieval Augmented Generation</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Document filter */}
      {readyDocs.length > 0 && (
        <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-white/30 font-mono">SCOPE:</span>
          <button
            onClick={() => setSelectedDocIds([])}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
              selectedDocIds.length === 0
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-white/40 hover:text-white/70 border border-white/10"
            }`}
          >
            All Docs
          </button>
          {readyDocs.slice(0, 4).map((doc) => (
            <button
              key={doc.id}
              onClick={() =>
                setSelectedDocIds((prev) =>
                  prev.includes(doc.id) ? prev.filter((i) => i !== doc.id) : [...prev, doc.id]
                )
              }
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all max-w-[120px] truncate ${
                selectedDocIds.includes(doc.id)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-white/40 hover:text-white/70 border border-white/10"
              }`}
              title={doc.filename}
            >
              {doc.filename.replace(".pdf", "")}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <BookOpen className="w-10 h-10 text-white/10 mb-4" />
            <p className="text-white/30 text-sm">Ask questions about your documents</p>
            <p className="text-white/15 text-xs mt-1 mb-8">Powered by RAG with source citations</p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {FOLLOW_UPS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  className="text-left text-xs text-white/40 hover:text-white/70 px-4 py-2.5 rounded-xl border border-white/[0.07] hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                {msg.role === "user" ? (
                  <div className="bg-primary/20 border border-primary/30 text-white/90 text-sm px-4 py-3 rounded-2xl rounded-tr-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/85">
                    {msg.isStreaming && !msg.content ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-primary/70 rounded-sm ml-0.5 streaming-cursor" />
                        )}
                      </div>
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <button
                          onClick={() => toggleCitation(msg.id)}
                          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors mb-2"
                        >
                          <FileText className="w-3 h-3" />
                          {msg.citations.length} source{msg.citations.length !== 1 ? "s" : ""}
                          {expandedCitations.has(msg.id) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {expandedCitations.has(msg.id) && (
                          <div className="space-y-2">
                            {msg.citations.map((c) => (
                              <div
                                key={c.ref}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-bold text-primary/70">
                                    [{c.ref}]
                                  </span>
                                  <span className="text-[10px] text-white/50 font-mono truncate">
                                    {c.filename}
                                    {c.page_number ? ` · p.${c.page_number}` : ""}
                                  </span>
                                  <span className="ml-auto text-[10px] text-green-400/60 font-mono">
                                    {Math.round(c.relevance_score * 100)}%
                                  </span>
                                </div>
                                <p className="text-[10px] text-white/30 line-clamp-2 leading-relaxed">
                                  {c.chunk_content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 focus-within:border-primary/40 transition-all">
          <textarea
            ref={textareaRef}
            id="rag-question-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendQuestion(input);
              }
            }}
            placeholder="Ask a question about your documents..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-white/90 text-sm placeholder-white/25 resize-none focus:outline-none leading-relaxed custom-scrollbar max-h-[160px]"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              id="rag-send-btn"
              onClick={() => sendQuestion(input)}
              disabled={!input.trim()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-primary hover:bg-primary/80 disabled:opacity-20 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
