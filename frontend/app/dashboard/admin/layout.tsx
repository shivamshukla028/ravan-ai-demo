"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin" && user.role !== "owner") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== "admin" && user.role !== "owner")) {
    return <div className="p-8 text-cyan-400">Loading Admin Panel...</div>;
  }

  const tabs = [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Subscriptions", href: "/dashboard/admin/subscriptions" },
    { label: "Security", href: "/dashboard/admin/security" },
    { label: "Operations", href: "/dashboard/admin/ops" },
    { label: "Enterprise", href: "/dashboard/admin/enterprise" },
  ];

  return (
    <div className="flex h-full flex-col lg:flex-row bg-[#0A0A0B] text-slate-200">
      {/* Admin Sidebar */}
      <div className="w-full lg:w-64 border-r border-slate-800 bg-[#0F0F13] p-4 flex flex-col gap-4 shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 uppercase tracking-widest text-sm mb-4">
          Admin Console
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
                    ? "bg-red-900/40 border border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : "bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
