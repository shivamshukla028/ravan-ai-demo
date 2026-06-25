"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, FolderPlus } from "lucide-react";
import { KBCategory } from "../hooks/useKnowledge";

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
  docId?: number;
}

interface Props {
  categories: KBCategory[];
  onUpload: (
    file: File,
    categoryId?: number,
    description?: string,
    onProgress?: (pct: number) => void
  ) => Promise<any>;
  onDocumentUploaded: (docId: number) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadZone({ categories, onUpload, onDocumentUploaded }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
      if (!pdfFiles.length) return;

      const MAX_SIZE = 50 * 1024 * 1024;
      for (const file of pdfFiles) {
        if (file.size > MAX_SIZE) {
          setUploadingFiles((prev) => [
            ...prev,
            { file, progress: 0, status: "error", error: "File exceeds 50MB limit" },
          ]);
          continue;
        }

        const uploadEntry: UploadingFile = { file, progress: 0, status: "uploading" };
        setUploadingFiles((prev) => [...prev, uploadEntry]);

        const updateEntry = (update: Partial<UploadingFile>) => {
          setUploadingFiles((prev) =>
            prev.map((u) => (u.file === file ? { ...u, ...update } : u))
          );
        };

        try {
          const result = await onUpload(
            file,
            selectedCategory,
            description || undefined,
            (pct) => updateEntry({ progress: pct })
          );
          updateEntry({ status: "processing", progress: 100, docId: result?.id });
          if (result?.id) {
            onDocumentUploaded(result.id);
          }
          // Simulate processing completion UI update
          setTimeout(() => {
            updateEntry({ status: "done" });
          }, 3000);
        } catch (err: any) {
          updateEntry({ status: "error", error: err.message || "Upload failed" });
        }
      }
    },
    [onUpload, selectedCategory, description, onDocumentUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadEntry = (file: File) => {
    setUploadingFiles((prev) => prev.filter((u) => u.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        id="upload-dropzone"
        onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(14,165,233,0.2)] scale-[1.01]"
            : "border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all ${
          isDragOver ? "bg-primary/20 scale-110" : "bg-white/[0.05]"
        }`}>
          <Upload className={`w-8 h-8 transition-colors ${isDragOver ? "text-primary" : "text-white/30"}`} />
        </div>

        <h3 className="text-white font-bold text-lg mb-1">
          {isDragOver ? "Drop PDFs here" : "Drag & Drop PDFs"}
        </h3>
        <p className="text-white/40 text-sm mb-4">
          or click to browse · PDF only · Max 50MB per file
        </p>

        {/* Options row */}
        <div
          className="flex items-center justify-center gap-3 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Category Selector */}
          <select
            value={selectedCategory ?? ""}
            onChange={(e) =>
              setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)
            }
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-primary/40 transition-all"
          >
            <option value="">No Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_20px_rgba(14,165,233,0.5)]"
          >
            <Upload className="w-4 h-4" />
            Select PDFs
          </button>
        </div>
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map(({ file, progress, status, error }) => (
            <div
              key={file.name + file.lastModified}
              className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3"
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {status === "uploading" && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {status === "processing" && (
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                )}
                {status === "done" && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/80 font-mono truncate">{file.name}</p>
                  <span className="text-[10px] text-white/40 ml-2 flex-shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>

                {status === "uploading" && (
                  <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                {status === "processing" && (
                  <p className="text-[10px] text-yellow-400 font-mono">
                    Processing & embedding... this may take a moment
                  </p>
                )}
                {status === "done" && (
                  <p className="text-[10px] text-green-400 font-mono">
                    Ready · Processing in background
                  </p>
                )}
                {status === "error" && (
                  <p className="text-[10px] text-red-400 font-mono">{error}</p>
                )}
              </div>

              <button
                onClick={() => removeUploadEntry(file)}
                className="flex-shrink-0 p-1 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
