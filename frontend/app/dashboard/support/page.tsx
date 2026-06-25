"use client";

import { useEffect, useState } from "react";
import { useSupport, UsageReport } from "./hooks/useSupport";
import Link from "next/link";

export default function SupportDashboardPage() {
  const { fetchUsage, loading } = useSupport();
  const [usage, setUsage] = useState<UsageReport | null>(null);

  useEffect(() => {
    fetchUsage().then(setUsage);
  }, [fetchUsage]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Customer Success Portal</h1>
        <p className="text-slate-400 mt-2">Manage your account usage, support requests, and billing.</p>
      </div>

      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">AI Tokens Used</div>
            <div className="text-3xl font-bold text-cyan-400">{usage.total_tokens.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Conversations</div>
            <div className="text-3xl font-bold text-white">{usage.conversations.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Documents</div>
            <div className="text-3xl font-bold text-white">{usage.total_documents.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Storage Used</div>
            <div className="text-3xl font-bold text-white">{(usage.storage_bytes / (1024*1024)).toFixed(2)} MB</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link href="/dashboard/support/tickets" className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
              <div className="font-semibold text-white">Submit a Support Ticket</div>
              <div className="text-sm text-slate-400 mt-1">Get help from our technical team.</div>
            </Link>
            <Link href="/dashboard/support/features" className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
              <div className="font-semibold text-white">Request a Feature</div>
              <div className="text-sm text-slate-400 mt-1">Suggest improvements or new tools for Ravan AI.</div>
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Live Support</h2>
          <div className="flex flex-col items-center justify-center h-48 bg-slate-900 border border-slate-800 border-dashed rounded-xl">
             <svg className="w-12 h-12 text-cyan-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             <div className="text-slate-300 font-medium">Need immediate assistance?</div>
             <div className="text-slate-500 text-sm mt-1 mb-4">Our agents usually reply within 5 minutes.</div>
             <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20">
               Start Live Chat
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
