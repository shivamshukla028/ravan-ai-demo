import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Database, Shield, Search, Bell, Settings, ChevronDown, Activity, Terminal } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden">
      {/* Sidebar Command Center */}
      <aside className="w-72 border-r border-white/[0.08] bg-[#050505]/95 backdrop-blur-3xl flex flex-col relative z-20">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">RAVAN AI</h2>
              <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">Command Center</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">System Status</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-500 font-mono">SECURE</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          <div>
            <span className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 block">Intelligence</span>
            <div className="space-y-1">
              <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" active />
              <NavItem href="/dashboard/chat" icon={<MessageSquare size={18} />} label="AI Assistant" />
              <NavItem href="/dashboard/knowledge" icon={<Database size={18} />} label="Knowledge Graph" />
            </div>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 block">Administration</span>
            <div className="space-y-1">
              <NavItem href="#" icon={<Settings size={18} />} label="Organization Settings" />
            </div>
          </div>

        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-white/[0.05]">
          <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/[0.03] transition-colors text-left group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center border border-white/10 shadow-inner group-hover:border-primary/50 transition-colors">
              <span className="text-sm font-bold text-white">US</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Security Admin</p>
              <p className="text-xs text-white/40 truncate font-mono">admin@qyntraix.com</p>
            </div>
            <Settings className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Cyber Background for Dashboard */}
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Top Header Navigation */}
        <header className="h-20 border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-8 relative z-20">
          <div className="flex-1 max-w-xl">
            {/* Global Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search queries, threats, IPs... (Cmd+K)"
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-white/[0.05] transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <span className="text-[10px] text-white/30 font-mono border border-white/10 px-1.5 py-0.5 rounded bg-white/5">⌘K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 ml-8">
            {/* Active Operations */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
              <Terminal className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50 font-mono">0 ACTIVE OPS</span>
            </div>

            {/* Notification Center */}
            <button className="relative p-2 rounded-full hover:bg-white/[0.05] transition-colors group">
              <Bell className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)] border border-[#050505]" />
            </button>
            
            <div className="w-px h-8 bg-white/[0.08]"></div>

            {/* Org Selector Dropdown Mock */}
            <button className="flex items-center gap-2 group">
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Qyntraix Global</span>
              <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
        active 
        ? 'bg-primary/10 text-primary font-semibold' 
        : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
      )}
      <div className={`${active ? 'text-primary' : 'text-white/40 group-hover:text-white/70'} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm tracking-wide">{label}</span>
    </Link>
  );
}
