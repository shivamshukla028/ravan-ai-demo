"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Shield, Copy, Check, User } from "lucide-react";
import { useState } from "react";
import { ChatMessage } from "../hooks/useChat";

interface Props {
  message: ChatMessage;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded transition-all border border-white/10"
      title="Copy code"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
  );
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`flex gap-4 group ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-white/20 flex items-center justify-center shadow-lg">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <Shield className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Role label */}
        <span className="text-[11px] text-white/30 font-mono mb-1.5 px-1">
          {isUser ? "You" : "Ravan AI"}
          {message.model && !isUser && (
            <span className="ml-2 text-primary/50">{message.model}</span>
          )}
        </span>

        {/* Message content */}
        <div
          ref={contentRef}
          className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-blue-600/80 to-indigo-700/80 text-white border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
              : "bg-white/[0.04] text-slate-200 border border-white/[0.08] shadow-inner"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:leading-relaxed prose-p:text-slate-200
              prose-headings:text-white prose-headings:font-bold
              prose-code:text-cyan-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
              prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent
              prose-blockquote:border-primary/50 prose-blockquote:text-slate-300
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-em:text-slate-300
              prose-ul:text-slate-200 prose-ol:text-slate-200
              prose-li:marker:text-primary/60
              prose-hr:border-white/10
              prose-table:text-slate-200 prose-th:text-white prose-th:bg-white/5 prose-td:border-white/10"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    const isBlock = !props.inline && match;

                    if (isBlock) {
                      return (
                        <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#1a1a2e]">
                          {/* Code block header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.05] border-b border-white/10">
                            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                              {match[1]}
                            </span>
                            <CopyButton text={codeString} />
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: "1rem",
                              background: "transparent",
                              fontSize: "0.8rem",
                              lineHeight: "1.6",
                            }}
                            codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full text-sm border-collapse border border-white/10 rounded-lg overflow-hidden">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-white/80 bg-white/[0.06] border border-white/10">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-2 text-xs text-white/70 border border-white/[0.06]">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {/* Token count (visible on hover) */}
        {(message.tokens_in || message.tokens_out) && (
          <span className="text-[10px] text-white/20 font-mono mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.tokens_in ? `↑${message.tokens_in}` : ""}{" "}
            {message.tokens_out ? `↓${message.tokens_out}` : ""} tokens
          </span>
        )}
      </div>
    </div>
  );
}
