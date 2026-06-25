"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Zap, Brain, Shield, Star, Cpu } from "lucide-react";
import { modelsApi, ModelGroup } from "@/lib/api";

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Anthropic: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Google:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DeepSeek:  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Qwen:      "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  OpenAI:    <Zap className="w-3.5 h-3.5" />,
  Anthropic: <Brain className="w-3.5 h-3.5" />,
  Google:    <Star className="w-3.5 h-3.5" />,
  DeepSeek:  <Cpu className="w-3.5 h-3.5" />,
  Qwen:      <Shield className="w-3.5 h-3.5" />,
};

const TAG_STYLES: Record<string, string> = {
  Smart:         "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Fast:          "bg-green-500/10 text-green-400 border-green-500/20",
  Cheap:         "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Safe:          "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Reasoning:     "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Long Context":"bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

// Fallback static model list if API isn't available
const FALLBACK_GROUPS: ModelGroup[] = [
  {
    group: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o", tags: ["Smart", "Fast"], provider: "openai" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", tags: ["Smart"], provider: "openai" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", tags: ["Fast", "Cheap"], provider: "openai" },
    ],
  },
  {
    group: "Anthropic",
    models: [
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", tags: ["Smart", "Safe"], provider: "anthropic" },
      { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku", tags: ["Fast", "Cheap"], provider: "anthropic" },
    ],
  },
  {
    group: "Google",
    models: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tags: ["Smart", "Long Context"], provider: "gemini" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", tags: ["Fast", "Cheap"], provider: "gemini" },
    ],
  },
  {
    group: "DeepSeek",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat", tags: ["Fast", "Cheap"], provider: "deepseek" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner", tags: ["Smart", "Reasoning"], provider: "deepseek" },
    ],
  },
  {
    group: "Qwen",
    models: [
      { id: "qwen-plus", label: "Qwen Plus", tags: ["Fast"], provider: "qwen" },
      { id: "qwen-max", label: "Qwen Max", tags: ["Smart"], provider: "qwen" },
    ],
  },
];

interface Props {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<ModelGroup[]>(FALLBACK_GROUPS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modelsApi.list()
      .then((res) => setGroups(res.data.models))
      .catch(() => setGroups(FALLBACK_GROUPS));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Find current model label
  const currentModel = groups.flatMap((g) => g.models).find((m) => m.id === value);
  const currentGroup = groups.find((g) => g.models.some((m) => m.id === value));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="model-selector-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all text-sm"
      >
        {currentGroup && (
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[currentGroup.group] || "bg-white/10 text-white/60"}`}>
            {PROVIDER_ICONS[currentGroup.group]}
          </span>
        )}
        <span className="text-white/90 font-medium">{currentModel?.label || value}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-2 space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {groups.map((group) => (
              <div key={group.group}>
                {/* Group header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${PROVIDER_COLORS[group.group] || "bg-white/5"} border mb-1`}>
                  {PROVIDER_ICONS[group.group]}
                  <span className="text-xs font-bold uppercase tracking-wider">{group.group}</span>
                </div>
                {/* Models in group */}
                {group.models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all mb-0.5 ${
                      value === model.id
                        ? "bg-primary/15 border border-primary/30 text-white"
                        : "hover:bg-white/[0.05] text-white/70 hover:text-white border border-transparent"
                    }`}
                  >
                    <span className="text-sm font-medium">{model.label}</span>
                    <div className="flex gap-1">
                      {model.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_STYLES[tag] || "bg-white/10 text-white/50 border-white/10"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
