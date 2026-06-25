"use client";

import { useEffect, useState } from "react";
import { useAdmin, AdminSubscription } from "../hooks/useAdmin";

export default function AdminSubscriptionsPage() {
  const { fetchSubscriptions, loading } = useAdmin();
  const [subs, setSubs] = useState<AdminSubscription[]>([]);

  useEffect(() => {
    fetchSubscriptions().then(setSubs);
  }, [fetchSubscriptions]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
        <p className="text-slate-400 mt-2">View active plans, upgrades, and billing status.</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">User Email</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Period End</th>
              <th className="px-6 py-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {subs.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 text-slate-200 font-medium">
                  {s.user_email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                    s.plan === 'enterprise' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/20' :
                    s.plan === 'pro' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {s.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    s.status === 'active' ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {subs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
