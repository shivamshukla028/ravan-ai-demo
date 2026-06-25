"use client";

import { useEffect, useState } from "react";
import { useAdmin, AdminDashboardData } from "./hooks/useAdmin";

export default function AdminDashboardPage() {
  const { fetchDashboard, loading } = useAdmin();
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    fetchDashboard().then(setData);
  }, [fetchDashboard]);

  if (loading && !data) {
    return <div className="p-8 text-slate-400">Loading Dashboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-2">Enterprise metrics and system health monitoring.</p>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Total Users</div>
            <div className="text-4xl font-bold text-white">{data.total_users}</div>
            <div className="text-xs text-green-400 mt-2">+ Active: {data.active_users}</div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Revenue</div>
            <div className="text-4xl font-bold text-green-400">₹{(data.total_revenue_paise / 100).toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2">Total invoiced (Paid)</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">AI Tokens Used</div>
            <div className="text-4xl font-bold text-cyan-400">{data.total_tokens_used.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2">Across {data.total_conversations.toLocaleString()} conversations</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">System Health</div>
            <div className="text-4xl font-bold text-green-500 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              {data.system_health}
            </div>
            <div className="text-xs text-slate-500 mt-2">All services operational</div>
          </div>
        </div>
      )}

      {/* Placeholder for future charts */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="h-64 border border-slate-800 rounded-xl bg-slate-900/50 flex items-center justify-center text-slate-600 border-dashed">
            [ Token Usage Analytics Chart ]
         </div>
         <div className="h-64 border border-slate-800 rounded-xl bg-slate-900/50 flex items-center justify-center text-slate-600 border-dashed">
            [ Revenue Growth Chart ]
         </div>
      </div>
    </div>
  );
}
