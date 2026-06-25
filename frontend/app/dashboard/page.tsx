import { Activity, ShieldAlert, Brain, Crosshair, TrendingUp, AlertTriangle, ArrowUpRight, Zap, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Threat Intelligence Panel</h1>
          <p className="text-white/50 text-sm">Global monitoring active. AI models operating at 99.9% confidence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-all">
            Export Report
          </button>
          <button className="px-4 py-2 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
            <Zap size={16} />
            Engage Defense
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Active Threats" 
          value="12" 
          change="+3" 
          trend="up" 
          icon={<ShieldAlert className="text-threat-high" />} 
          statusColor="bg-threat-high"
        />
        <KpiCard 
          title="Anomalies Detected" 
          value="847" 
          change="-12%" 
          trend="down" 
          icon={<Crosshair className="text-threat-medium" />} 
          statusColor="bg-threat-medium"
        />
        <KpiCard 
          title="AI Confidence Score" 
          value="99.4%" 
          change="+0.2%" 
          trend="up" 
          icon={<Brain className="text-primary" />} 
          statusColor="bg-primary"
        />
        <KpiCard 
          title="Network Traffic" 
          value="4.2 TB/s" 
          change="+5%" 
          trend="up" 
          icon={<Activity className="text-white/70" />} 
          statusColor="bg-white/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area Mockup */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Threat Activity Over Time</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded bg-white/10 text-xs text-white/70 cursor-pointer">1H</span>
              <span className="px-3 py-1 rounded bg-white/5 text-xs text-white/40 cursor-pointer">24H</span>
              <span className="px-3 py-1 rounded bg-white/5 text-xs text-white/40 cursor-pointer">7D</span>
            </div>
          </div>
          
          <div className="flex-1 relative flex items-end justify-between px-2 gap-2 mt-10">
             {/* Background Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-white/10 pointer-events-none">
                <div className="w-full border-t border-white/5 border-dashed"></div>
                <div className="w-full border-t border-white/5 border-dashed"></div>
                <div className="w-full border-t border-white/5 border-dashed"></div>
                <div className="w-full border-t border-white/5 border-dashed"></div>
                <div className="w-full"></div>
             </div>
             
             {/* Mock Bars */}
             {Array.from({ length: 24 }).map((_, i) => {
               const height = Math.random() * 80 + 10;
               const isHigh = height > 70;
               return (
                 <div key={i} className="relative group flex-1 flex justify-center h-full items-end z-10">
                   <div 
                     className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${isHigh ? 'bg-threat-high/80 group-hover:bg-threat-high shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-primary/40 group-hover:bg-primary/60'}`}
                     style={{ height: `${height}%` }}
                   ></div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* AI Analysis Feed */}
        <div className="glass-panel p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Live AI Analysis</h2>
          </div>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
             <AiFeedItem 
               time="Just now" 
               message="Detected unusual lateral movement in Subnet-Alpha. Model isolated affected nodes." 
               type="critical" 
             />
             <AiFeedItem 
               time="2m ago" 
               message="Analyzed payload from unknown IP. Identified as polymorphic malware variant." 
               type="high" 
             />
             <AiFeedItem 
               time="15m ago" 
               message="Knowledge graph updated with 500 new CVE definitions from global feed." 
               type="info" 
             />
             <AiFeedItem 
               time="1h ago" 
               message="Routine scan completed. 0 zero-day vulnerabilities found in core infrastructure." 
               type="success" 
             />
             <AiFeedItem 
               time="2h ago" 
               message="Blocked 1,420 brute-force attempts on perimeter firewall." 
               type="warning" 
             />
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Security Events</h2>
          <button className="text-primary text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-1">
            View All <ArrowUpRight size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="pb-3 pl-4 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Event Type</th>
                <th className="pb-3 font-semibold">Source IP</th>
                <th className="pb-3 font-semibold">Target Asset</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <TableRow severity="critical" type="DDoS Attempt" ip="192.168.1.104" target="API Gateway" time="10:42 AM" />
              <TableRow severity="high" type="SQL Injection" ip="45.33.22.11" target="Database Cluster" time="09:15 AM" />
              <TableRow severity="medium" type="Failed Login" ip="10.0.0.5" target="Admin Portal" time="08:30 AM" />
              <TableRow severity="low" type="Port Scan" ip="172.16.0.42" target="Firewall" time="07:11 AM" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, change, trend, icon, statusColor }: { title: string, value: string, change: string, trend: 'up'|'down', icon: React.ReactNode, statusColor: string }) {
  const isPositive = trend === 'up';
  
  return (
    <div className="glass-panel p-6 relative group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-${statusColor.replace('bg-', '')}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl pointer-events-none`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-white/5 border border-white/5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
          {change}
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-black text-white mb-1 tracking-tight">{value}</p>
        <div className="flex items-center gap-2">
           <span className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_5px_currentColor]`}></span>
           <p className="text-sm text-white/50 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
}

function AiFeedItem({ time, message, type }: { time: string, message: string, type: 'critical'|'high'|'warning'|'info'|'success' }) {
  const colors = {
    critical: 'text-threat-critical border-threat-critical/30 bg-threat-critical/10',
    high: 'text-threat-high border-threat-high/30 bg-threat-high/10',
    warning: 'text-threat-medium border-threat-medium/30 bg-threat-medium/10',
    info: 'text-primary border-primary/30 bg-primary/10',
    success: 'text-threat-low border-threat-low/30 bg-threat-low/10',
  };
  
  const icons = {
    critical: <AlertTriangle size={14} />,
    high: <AlertTriangle size={14} />,
    warning: <ShieldAlert size={14} />,
    info: <Activity size={14} />,
    success: <CheckCircle2 size={14} />,
  }

  return (
    <div className="flex gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 relative overflow-hidden group">
      <div className={`w-1 h-full absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity ${colors[type].split(' ')[2]}`}></div>
      <div className={`mt-1 shrink-0 p-1.5 rounded-md ${colors[type]}`}>
         {icons[type]}
      </div>
      <div>
        <p className="text-xs text-white/40 mb-1 font-mono">{time}</p>
        <p className="text-sm text-white/80 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

function TableRow({ severity, type, ip, target, time }: { severity: 'critical'|'high'|'medium'|'low', type: string, ip: string, target: string, time: string }) {
  const badges = {
    critical: 'bg-threat-critical/20 text-threat-critical border-threat-critical/30',
    high: 'bg-threat-high/20 text-threat-high border-threat-high/30',
    medium: 'bg-threat-medium/20 text-threat-medium border-threat-medium/30',
    low: 'bg-threat-low/20 text-threat-low border-threat-low/30',
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      <td className="py-4 pl-4">
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${badges[severity]}`}>
          {severity}
        </span>
      </td>
      <td className="py-4 text-white/90 font-medium">{type}</td>
      <td className="py-4 text-white/60 font-mono text-xs">{ip}</td>
      <td className="py-4 text-white/60">{target}</td>
      <td className="py-4 text-white/40 text-sm">{time}</td>
      <td className="py-4 text-right pr-4">
        <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition-all">
          Investigate
        </button>
      </td>
    </tr>
  );
}
