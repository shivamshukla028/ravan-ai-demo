"use client";

import { useState } from "react";
import {
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  Tag,
  HardDrive,
  FileStack,
  BookOpen,
  MessageSquare,
  X,
} from "lucide-react";
import { KBDocument } from "../hooks/useKnowledge";

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  ready: {
    label: "Ready",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

interface Props {
  doc: KBDocument;
  onDelete: (id: number) => void;
  onAskQuestion: (doc: KBDocument) => void;
}

export function DocumentCard({ doc, onDelete, onAskQuestion }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.processing;
  const StatusIcon = statusCfg.icon;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(doc.id);
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="relative group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-primary/20 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(14,165,233,0.06)] transition-all duration-300 overflow-hidden">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

      {/* Delete confirm overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-[#0a0a12]/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-white font-semibold text-sm mb-1">Delete Document?</p>
          <p className="text-white/40 text-xs text-center mb-5">
            This will remove the document and all its embeddings from the knowledge base.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between mb-4 relative z-0">
        <div className="flex items-center gap-3">
          {/* File icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate max-w-[160px]" title={doc.filename}>
              {doc.filename}
            </p>
            <p className="text-[11px] text-white/30 font-mono">{formatDate(doc.created_at)}</p>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold mb-4 ${statusCfg.bg} ${statusCfg.color}`}>
        <StatusIcon className={`w-3 h-3 ${doc.status === "processing" ? "animate-spin" : ""}`} />
        {statusCfg.label}
      </div>

      {/* Category tag */}
      {doc.category_name && (
        <div className="flex items-center gap-1 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: doc.category_color || "#0ea5e9" }}
          />
          <span className="text-[11px] text-white/40">{doc.category_name}</span>
        </div>
      )}

      {/* Metadata stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-white/[0.03] rounded-lg py-2 px-1">
          <HardDrive className="w-3 h-3 text-white/25 mx-auto mb-0.5" />
          <p className="text-[11px] text-white/50 font-mono">{formatBytes(doc.file_size)}</p>
        </div>
        <div className="text-center bg-white/[0.03] rounded-lg py-2 px-1">
          <BookOpen className="w-3 h-3 text-white/25 mx-auto mb-0.5" />
          <p className="text-[11px] text-white/50 font-mono">{doc.page_count ?? "—"}p</p>
        </div>
        <div className="text-center bg-white/[0.03] rounded-lg py-2 px-1">
          <FileStack className="w-3 h-3 text-white/25 mx-auto mb-0.5" />
          <p className="text-[11px] text-white/50 font-mono">{doc.chunk_count ?? 0}ch</p>
        </div>
      </div>

      {/* Error message */}
      {doc.status === "failed" && doc.error_message && (
        <p className="text-[10px] text-red-400/70 font-mono mb-3 truncate" title={doc.error_message}>
          {doc.error_message}
        </p>
      )}

      {/* Ask Question CTA */}
      {doc.status === "ready" && (
        <button
          id={`ask-doc-${doc.id}`}
          onClick={() => onAskQuestion(doc)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-semibold rounded-xl transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask Questions
        </button>
      )}
    </div>
  );
}
