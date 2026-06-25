"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const tabs = [
    { label: "Dashboard", href: "/dashboard/support" },
    { label: "My Tickets", href: "/dashboard/support/tickets" },
    { label: "Feature Requests", href: "/dashboard/support/features" },
    { label: "Organization Settings", href: "/dashboard/support/settings" },
  ];

  return (
    <div className="flex h-full flex-col lg:flex-row bg-[#0A0A0B] text-slate-200">
      {/* Customer Success Sidebar */}
      <div className="w-full lg:w-64 border-r border-slate-800 bg-[#0F0F13] p-4 flex flex-col gap-4 shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-widest text-sm mb-4">
          Customer Portal
        </h2>
        
        <div className="flex flex-col gap-2">
          {tabs.map((t) => {
            const isActive = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`p-3 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? "bg-indigo-900/40 border border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    : "bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-slate-800 pt-4">
          <Link
            href="/dashboard/knowledge"
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Knowledge Base
          </Link>
          <button className="mt-2 w-full flex items-center gap-2 p-3 rounded-lg bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/60 text-sm font-medium transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Live Chat
          </button>
        </div>
      </div>

      {/* Main Support Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
