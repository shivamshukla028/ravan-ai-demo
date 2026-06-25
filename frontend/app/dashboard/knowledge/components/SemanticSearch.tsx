"use client";

import { useState, useCallback } from "react";
import { Search, X, FileText, Loader2, ExternalLink } from "lucide-react";
import { SearchResult } from "../hooks/useKnowledge";

interface Props {
  onSearch: (query: string) => void;
  results: SearchResult[];
  searching: boolean;
  onAskInRAG: (query: string, result: SearchResult) => void;
}

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct > 70 ? "bg-green-500" : pct > 40 ? "bg-yellow-500" : "bg-orange-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-white/40 w-7 text-right">{pct}%</span>
    </div>
  );
}

export function SemanticSearch({ onSearch, results, searching, onAskInRAG }: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(() => {
    if (query.trim()) onSearch(query.trim());
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            id="knowledge-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Semantic search across all documents..."
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-11 pr-10 py-3 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          id="semantic-search-btn"
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="flex items-center gap-2 px-5 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-white/30 font-mono px-1">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((result, i) => (
            <div
              key={`${result.document_id}-${result.chunk_index}`}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:border-primary/20 transition-all group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/80">{result.filename}</p>
                    {result.page_number && (
                      <p className="text-[10px] text-white/30 font-mono">Page {result.page_number}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onAskInRAG(query, result)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ask AI
                </button>
              </div>

              {/* Relevance */}
              <RelevanceBar score={result.relevance_score} />

              {/* Content excerpt */}
              <p className="text-xs text-white/50 mt-2 line-clamp-3 leading-relaxed font-mono">
                {result.chunk_content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state after search */}
      {!searching && results.length === 0 && query && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-white/25 text-sm">No results found for "{query}"</p>
          <p className="text-white/15 text-xs mt-1">Try different search terms or upload more documents</p>
        </div>
      )}
    </div>
  );
}
