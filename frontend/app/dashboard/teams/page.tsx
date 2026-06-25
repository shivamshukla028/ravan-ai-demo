"use client";

import { useEffect, useState } from "react";
import { useTeams, Team } from "./hooks/useTeams";

export default function TeamsPage() {
  const { teams, loading, fetchTeams, createTeam, inviteMember, fetchDashboard, fetchActivity } = useTeams();
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  useEffect(() => {
    fetchTeams().then((data) => {
      if (data && data.length > 0) {
        handleSelectTeam(data[0]);
      }
    });
  }, [fetchTeams]);

  const handleSelectTeam = async (team: Team) => {
    setActiveTeam(team);
    const dash = await fetchDashboard(team.id);
    const acts = await fetchActivity(team.id);
    setDashboard(dash);
    setActivities(acts);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    const team = await createTeam(newTeamName);
    setNewTeamName("");
    handleSelectTeam(team);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !inviteEmail) return;
    try {
      await inviteMember(activeTeam.id, inviteEmail, inviteRole);
      setInviteEmail("");
      // Refresh team data
      const dash = await fetchDashboard(activeTeam.id);
      const acts = await fetchActivity(activeTeam.id);
      setDashboard(dash);
      setActivities(acts);
    } catch (err) {
      alert("Failed to invite member. Make sure they are registered.");
    }
  };

  if (loading && !activeTeam) {
    return <div className="p-8 text-cyan-400">Loading teams...</div>;
  }

  return (
    <div className="flex h-full flex-col lg:flex-row bg-[#0A0A0B] text-slate-200">
      {/* Sidebar: Team List */}
      <div className="w-full lg:w-64 border-r border-slate-800 bg-[#0F0F13] p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Workspaces
        </h2>
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTeam(t)}
              className={`p-3 rounded-lg text-left transition-all ${
                activeTeam?.id === t.id
                  ? "bg-cyan-900/40 border border-cyan-500/50 text-cyan-300"
                  : "bg-slate-800/40 hover:bg-slate-800 text-slate-400"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs opacity-60">{t.members.length} members</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateTeam} className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="New Team Name..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded p-2 text-sm font-semibold hover:from-cyan-500 hover:to-blue-500 transition-colors"
          >
            Create Team
          </button>
        </form>
      </div>

      {/* Main Content: Dashboard */}
      <div className="flex-1 overflow-y-auto p-8">
        {!activeTeam ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select or create a team to view the dashboard.
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{activeTeam.name}</h1>
              <p className="text-slate-400">Manage your team workspace, members, and shared resources.</p>
            </div>

            {/* Stats */}
            {dashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Members</div>
                  <div className="text-2xl font-bold text-white">{dashboard.total_members}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Shared Documents</div>
                  <div className="text-2xl font-bold text-cyan-400">{dashboard.total_documents}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Conversations</div>
                  <div className="text-2xl font-bold text-purple-400">{dashboard.total_conversations}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Storage Used</div>
                  <div className="text-2xl font-bold text-green-400">
                    {(dashboard.storage_used_bytes / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Members Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Team Members</h3>
                <div className="space-y-3 mb-6">
                  {activeTeam.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div>
                        <div className="text-slate-200 font-medium">{m.user_name}</div>
                        <div className="text-xs text-slate-500">{m.user_email}</div>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded bg-slate-800 text-slate-300">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="User email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white rounded px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Invite
                  </button>
                </form>
              </div>

              {/* Activity Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4">Activity Log</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-cyan-500 shrink-0" />
                      <div>
                        <div className="text-slate-300">
                          <span className="font-semibold text-white">{act.user_name}</span>{" "}
                          <span className="opacity-80">{act.details || act.action}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(act.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-slate-500 text-sm">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
