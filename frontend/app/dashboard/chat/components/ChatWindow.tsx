"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  KeyboardEvent,
} from "react";
import {
  Send,
  StopCircle,
  Paperclip,
  Download,
  Shield,
  Zap,
  Cpu,
} from "lucide-react";
import { ChatMessage } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { ModelSelector } from "./ModelSelector";
import { conversationsApi } from "@/lib/api";

const WELCOME_PROMPTS = [
  "Analyze this CVE and assess the risk level",
  "Write a Python script for network port scanning",
  "Explain the MITRE ATT&CK framework",
  "Review this code for security vulnerabilities",
  "Draft an ISO 27001 risk assessment template",
  "Explain Zero Trust Architecture principles",
];

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  model: string;
  totalTokensIn: number;
  totalTokensOut: number;
  activeConversationId: number | null;
  onSend: (content: string, model: string) => void;
  onStop: () => void;
  onModelChange: (model: string) => void;
}

export function ChatWindow({
  messages,
  isStreaming,
  model,
  totalTokensIn,
  totalTokensOut,
  activeConversationId,
  onSend,
  onStop,
  onModelChange,
}: Props) {
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim(), model);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, model, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now, add the filename as context to the input
    setInput((prev) =>
      prev + (prev ? "\n" : "") + `[Attached file: ${file.name}]\n`
    );
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = async (fmt: "json" | "markdown") => {
    if (!activeConversationId) return;
    const url = conversationsApi.exportUrl(activeConversationId, fmt);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const ext = fmt === "markdown" ? "md" : "json";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ravan-chat.${ext}`;
    a.click();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#030305] relative">
      {/* Cyber background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/3 rounded-full blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-sm relative z-10">
        <ModelSelector value={model} onChange={onModelChange} />

        <div className="flex items-center gap-3">
          {/* Token counter */}
          {(totalTokensIn > 0 || totalTokensOut > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono">
              <Zap className="w-3 h-3 text-yellow-500/60" />
              <span className="text-white/30">↑{totalTokensIn.toLocaleString()}</span>
              <span className="text-white/15">·</span>
              <span className="text-white/30">↓{totalTokensOut.toLocaleString()}</span>
              <span className="text-white/20 ml-0.5">tokens</span>
            </div>
          )}

          {/* Export button */}
          {activeConversationId && (
            <div className="relative group/export">
              <button
                id="export-chat-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              {/* Export dropdown */}
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#0a0a12] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover/export:opacity-100 pointer-events-none group-hover/export:pointer-events-auto transition-all z-20 overflow-hidden">
                <button
                  onClick={() => handleExport("json")}
                  className="w-full px-4 py-2.5 text-left text-xs text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport("markdown")}
                  className="w-full px-4 py-2.5 text-left text-xs text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Export as Markdown
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {isEmpty ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="mb-8 relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(14,165,233,0.2)]">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#030305] flex items-center justify-center">
                <Cpu className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ravan AI</h2>
            <p className="text-white/40 text-sm mb-10 max-w-md">
              Your cybersecurity intelligence assistant. Ask anything about threats, vulnerabilities, compliance, or security code review.
            </p>
            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {WELCOME_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-primary/20 text-white/55 hover:text-white/80 text-xs transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-[#030305] via-[#030305]/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_20px_rgba(14,165,233,0.08)] transition-all">
            {/* File upload */}
            <button
              id="file-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="flex-shrink-0 p-1.5 text-white/25 hover:text-white/60 disabled:opacity-30 transition-colors rounded-lg hover:bg-white/5"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.txt,.md,.json,.py,.js,.ts,.sh,.log,.csv"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Ravan AI about threats, vulnerabilities, compliance..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-white/90 placeholder-white/25 text-sm resize-none focus:outline-none leading-relaxed disabled:opacity-60 max-h-[200px] overflow-y-auto custom-scrollbar"
            />

            {/* Send / Stop button */}
            {isStreaming ? (
              <button
                id="stop-streaming-btn"
                onClick={onStop}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-all"
              >
                <StopCircle className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                id="send-message-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_20px_rgba(14,165,233,0.5)]"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">
            Shift + Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
