"use client";

import { useEffect, useState } from "react";
import { useAdmin, AdminAuditLog } from "../hooks/useAdmin";

export default function AdminSecurityPage() {
  const { fetchLogs, loading } = useAdmin();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);

  useEffect(() => {
    fetchLogs().then(setLogs);
  }, [fetchLogs]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Security & Audit Logs</h1>
        <p className="text-slate-400 mt-2">Monitor login history, system events, and suspicious activities.</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">IP Address</th>
              <th className="px-6 py-4 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-slate-800 text-cyan-400">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-200">
                  {log.user_email || "System"}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {log.ip_address || "N/A"}
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-xs">
                  {log.details || "-"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No security logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
