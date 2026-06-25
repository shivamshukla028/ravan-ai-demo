"use client";

import { useAuth } from "@/hooks/useAuth";

export default function SupportSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Organization Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account profile and notification preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Settings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">User Profile</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input type="text" disabled value={user?.full_name || ""} className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
              <input type="email" disabled value={user?.email || ""} className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account Role</label>
              <input type="text" disabled value={user?.role || "User"} className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 cursor-not-allowed uppercase" />
            </div>
            <div className="pt-4">
              <button type="button" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                Change Password...
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
               <div>
                 <div className="text-sm font-bold text-white">Billing Alerts</div>
                 <div className="text-xs text-slate-500 mt-1">Receive emails about upcoming invoice payments.</div>
               </div>
               <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 cursor-pointer" />
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
               <div>
                 <div className="text-sm font-bold text-white">Feature Updates</div>
                 <div className="text-xs text-slate-500 mt-1">Get notified when a feature you upvoted is released.</div>
               </div>
               <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 cursor-pointer" />
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
               <div>
                 <div className="text-sm font-bold text-white">Support Ticket Activity</div>
                 <div className="text-xs text-slate-500 mt-1">Receive updates when agents reply to your tickets.</div>
               </div>
               <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 cursor-pointer" />
             </div>
          </div>
          <button className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors w-full border border-slate-700">
             Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
}
