"use client";

import { FileText, HardDrive, Layers, FolderOpen, Clock, CheckCircle } from "lucide-react";
import { KBStats } from "../hooks/useKnowledge";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = "text-primary" }: StatCardProps) {
  return (
    <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 overflow-hidden group hover:border-white/[0.12] transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
      </div>
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] mb-3 ${accent}`}>
          {icon}
        </div>
        <p className="text-2xl font-black text-white mb-0.5 font-mono">{value}</p>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-white/25 mt-0.5 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

export function StatsPanel({ stats }: { stats: KBStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard
        icon={<FileText className="w-4 h-4" />}
        label="Total Docs"
        value={stats.total_documents}
        sub={`${stats.ready_documents} ready`}
        accent="text-primary"
      />
      <StatCard
        icon={<HardDrive className="w-4 h-4" />}
        label="Storage Used"
        value={formatBytes(stats.total_size_bytes)}
        accent="text-violet-400"
      />
      <StatCard
        icon={<Layers className="w-4 h-4" />}
        label="Total Chunks"
        value={stats.total_chunks.toLocaleString()}
        sub="Indexed embeddings"
        accent="text-cyan-400"
      />
      <StatCard
        icon={<CheckCircle className="w-4 h-4" />}
        label="Ready"
        value={stats.ready_documents}
        sub="Available for Q&A"
        accent="text-green-400"
      />
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label="Processing"
        value={stats.processing_documents}
        sub={stats.failed_documents ? `${stats.failed_documents} failed` : undefined}
        accent="text-yellow-400"
      />
      <StatCard
        icon={<FolderOpen className="w-4 h-4" />}
        label="Categories"
        value={stats.categories_count}
        accent="text-orange-400"
      />
    </div>
  );
}
