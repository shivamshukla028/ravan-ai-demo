"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Search,
  Database,
  Plus,
  Grid3X3,
  List,
  Filter,
  RefreshCw,
  Sparkles,
  FolderPlus,
  X,
  Check,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react";

import { useKnowledge, KBDocument } from "./hooks/useKnowledge";
import { StatsPanel } from "./components/StatsPanel";
import { UploadZone } from "./components/UploadZone";
import { DocumentCard } from "./components/DocumentCard";
import { SemanticSearch } from "./components/SemanticSearch";
import { RAGChat } from "./components/RAGChat";

type TabId = "library" | "upload" | "search" | "rag";

const CATEGORY_COLORS = [
  "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [ragDoc, setRagDoc] = useState<KBDocument | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialRagQuestion, setInitialRagQuestion] = useState("");

  const {
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
  } = useKnowledge();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchDocuments({ search: searchFilter, category_id: categoryFilter, status: statusFilter || undefined }),
      fetchStats(),
      fetchCategories(),
    ]);
    setIsRefreshing(false);
  }, [fetchDocuments, fetchStats, fetchCategories, searchFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchDocuments({
      search: searchFilter || undefined,
      category_id: categoryFilter,
      status: statusFilter || undefined,
    });
  }, [searchFilter, categoryFilter, statusFilter]);

  const handleDocumentUploaded = useCallback(
    (docId: number) => {
      pollDocumentStatus(docId, () => {});
      setActiveTab("library");
    },
    [pollDocumentStatus]
  );

  const handleAskQuestion = useCallback((doc: KBDocument) => {
    setRagDoc(doc);
    setActiveTab("rag");
    setInitialRagQuestion("");
  }, []);

  const handleAskInRAGFromSearch = useCallback((query: string) => {
    setInitialRagQuestion(query);
    setActiveTab("rag");
  }, []);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    await createCategory(newCatName.trim(), newCatColor, "folder");
    setNewCatName("");
    setNewCatColor(CATEGORY_COLORS[0]);
    setShowNewCategory(false);
  };

  const TABS = [
    { id: "library" as TabId, label: "Document Library", icon: Database, badge: documents.length },
    { id: "upload" as TabId, label: "Upload PDFs", icon: Upload },
    { id: "search" as TabId, label: "Semantic Search", icon: Search },
    { id: "rag" as TabId, label: "Ask AI", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-primary" />
            </span>
            Knowledge Graph
          </h1>
          <p className="text-white/40 text-sm mt-2 ml-13">
            Upload PDFs · Semantic Search · RAG-powered Q&A with source citations
          </p>
        </div>
        <button
          id="refresh-kb-btn"
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Panel */}
      <StatsPanel stats={stats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-1.5">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            id={`kb-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
              activeTab === id
                ? "bg-primary/15 text-primary border border-primary/25 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-white/10 text-white/60 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Document Library ─────────────────────────────────────────────── */}
      {activeTab === "library" && (
        <div className="space-y-5">
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter documents..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-primary/40 transition-all"
            >
              <option value="">All Status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter ?? ""}
                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-primary/40 transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* New Category */}
            <button
              id="new-category-btn"
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Category</span>
            </button>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Upload CTA */}
            <button
              onClick={() => setActiveTab("upload")}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(14,165,233,0.25)]"
            >
              <Plus className="w-4 h-4" />
              Upload PDF
            </button>
          </div>

          {/* New Category Form */}
          {showNewCategory && (
            <div className="flex items-center gap-3 bg-white/[0.03] border border-primary/20 rounded-2xl p-4">
              <FolderPlus className="w-5 h-5 text-primary flex-shrink-0" />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                placeholder="Category name..."
                autoFocus
                className="flex-1 bg-transparent text-white/90 text-sm placeholder-white/30 focus:outline-none"
              />
              <div className="flex gap-1.5 flex-shrink-0">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full transition-all ${newCatColor === c ? "ring-2 ring-white/50 ring-offset-1 ring-offset-transparent scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button onClick={handleCreateCategory} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-all">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNewCategory(false)} className="p-1.5 text-white/30 hover:text-white/60 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter(undefined)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!categoryFilter ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-white/40 hover:border-white/20"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id === categoryFilter ? undefined : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${categoryFilter === cat.id ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/40 hover:border-white/20"}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Document Grid / List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-lg font-semibold mb-2">No documents yet</p>
              <p className="text-white/20 text-sm mb-6">Upload your first PDF to get started</p>
              <button
                onClick={() => setActiveTab("upload")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary rounded-xl text-sm font-semibold transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload PDF
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={deleteDocument}
                  onAskQuestion={handleAskQuestion}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider hidden md:table-cell">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider hidden lg:table-cell">Pages</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider hidden lg:table-cell">Chunks</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider hidden md:table-cell">Uploaded</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-white/85 font-medium truncate max-w-[200px]">{doc.filename}</p>
                            {doc.category_name && (
                              <p className="text-[10px] text-white/30">{doc.category_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-white/40 font-mono">
                          {doc.file_size ? `${(doc.file_size / 1048576).toFixed(1)} MB` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-white/40 font-mono">{doc.page_count ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-white/40 font-mono">{doc.chunk_count ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          doc.status === "ready"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : doc.status === "processing"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {doc.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-white/30 font-mono">
                          {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.status === "ready" && (
                            <button
                              onClick={() => handleAskQuestion(doc)}
                              className="text-[10px] text-primary/70 hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-all flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              Ask
                            </button>
                          )}
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="text-[10px] text-red-400/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Upload Tab ───────────────────────────────────────────────────── */}
      {activeTab === "upload" && (
        <div className="max-w-3xl mx-auto">
          <UploadZone
            categories={categories}
            onUpload={uploadDocument}
            onDocumentUploaded={handleDocumentUploaded}
          />
        </div>
      )}

      {/* ─── Semantic Search Tab ──────────────────────────────────────────── */}
      {activeTab === "search" && (
        <div className="max-w-3xl mx-auto">
          <SemanticSearch
            onSearch={semanticSearch}
            results={searchResults}
            searching={searching}
            onAskInRAG={handleAskInRAGFromSearch}
          />
        </div>
      )}

      {/* ─── RAG Chat Tab ─────────────────────────────────────────────────── */}
      {activeTab === "rag" && (
        <div className="h-[70vh] min-h-[500px]">
          <RAGChat
            documents={documents}
            initialQuestion={initialRagQuestion}
          />
        </div>
      )}
    </div>
  );
}
