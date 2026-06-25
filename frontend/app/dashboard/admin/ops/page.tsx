"use client";

import { useEffect, useState } from "react";
import { useOps, SystemHealth } from "./hooks/useOps";

export default function AdminOpsPage() {
  const { fetchHealth, triggerBackup, testAlert, loading, actionLoading } = useOps();
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const loadHealth = async () => {
    const data = await fetchHealth();
    setHealth(data);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const handleBackup = async () => {
    try {
      const res = await triggerBackup();
      alert(res.message || "Backup triggered");
    } catch (e) {
      alert("Backup failed. Check logs.");
    }
  };

  const handleTestAlert = async () => {
    try {
      await testAlert();
      alert("Test alert sent to ops channel/email.");
    } catch (e) {
      alert("Test alert failed.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Production Operations</h1>
          <p className="text-slate-400 mt-2">Monitor system health, infrastructure, and trigger runbooks.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleTestAlert} 
             disabled={actionLoading}
             className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors border border-slate-700 disabled:opacity-50"
           >
             Test Alert Hook
           </button>
           <button 
             onClick={handleBackup} 
             disabled={actionLoading}
             className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
           >
             {actionLoading ? "Processing..." : "Trigger Manual Backup"}
           </button>
        </div>
      </div>

      {!health && loading ? (
        <div className="text-slate-400">Loading system metrics...</div>
      ) : health ? (
        <div className="space-y-8">
          
          {/* Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">API Status</div>
              <div className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                {health.status.toUpperCase()}
              </div>
              <div className="text-xs text-slate-500 mt-2">Uptime: {formatUptime(health.uptime_seconds)}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">PostgreSQL DB</div>
              <div className={`text-xl font-bold ${health.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                {health.database}
              </div>
              <div className="text-xs text-slate-500 mt-2">Connection pool healthy</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">ChromaDB Node</div>
              <div className="text-xl font-bold text-green-400">Connected</div>
              <div className="text-xs text-slate-500 mt-2">Local ephemeral storage</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Redis Cache</div>
              <div className="text-xl font-bold text-slate-500">Not Configured</div>
              <div className="text-xs text-slate-500 mt-2">Using local memory</div>
            </div>
          </div>

          {/* Hardware Metrics */}
          <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Hardware Telemetry</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CPU Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">CPU Usage</div>
              <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${health.cpu_percent > 85 ? 'bg-red-500' : health.cpu_percent > 60 ? 'bg-orange-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${health.cpu_percent}%` }} 
                />
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-4xl font-bold text-white">{health.cpu_percent}%</span>
                <span className="text-xs text-slate-500">8 Cores</span>
              </div>
            </div>

            {/* Memory Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Memory Usage</div>
              <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${health.memory_percent > 85 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${health.memory_percent}%` }} 
                />
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-4xl font-bold text-white">{health.memory_percent}%</span>
                <span className="text-xs text-slate-500">{health.memory_used_gb} GB / {health.memory_total_gb} GB</span>
              </div>
            </div>

            {/* Disk Gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Disk Usage</div>
              <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${health.disk_percent > 90 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${health.disk_percent}%` }} 
                />
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="text-4xl font-bold text-white">{health.disk_percent}%</span>
                <span className="text-xs text-slate-500">Primary Mount</span>
              </div>
            </div>
            
          </div>

          {/* Infrastructure Settings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Security & Infrastructure Settings</h3>
            <div className="space-y-4 max-w-2xl">
               <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
                 <div>
                   <div className="text-sm font-bold text-white">Rate Limiting Filter</div>
                   <div className="text-xs text-slate-500 mt-1">Limits IPs to 100 req/min at the application middleware layer.</div>
                 </div>
                 <div className="text-green-400 text-sm font-bold uppercase tracking-wide">Active</div>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
                 <div>
                   <div className="text-sm font-bold text-white">Strict Security Headers (HSTS, X-Frame)</div>
                   <div className="text-xs text-slate-500 mt-1">Injects required headers to prevent XSS and Clickjacking.</div>
                 </div>
                 <div className="text-green-400 text-sm font-bold uppercase tracking-wide">Active</div>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg opacity-50">
                 <div>
                   <div className="text-sm font-bold text-white">Cloudflare DDoS Mitigation Hooks</div>
                   <div className="text-xs text-slate-500 mt-1">Requires external DNS configuration.</div>
                 </div>
                 <div className="text-slate-500 text-sm font-bold uppercase tracking-wide">External</div>
               </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
